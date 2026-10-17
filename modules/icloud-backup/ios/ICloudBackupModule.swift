// Minimal iCloud Documents access for Hablits backups.
//
// Why a local module: expo-file-system can't reach the ubiquity container.
// This exposes exactly four things — is iCloud available, write a string,
// read a string, and the file's modification date — on a background queue.
//
// Requires the iCloud capability with "iCloud Documents" and a container
// named iCloud.<bundleIdentifier> (configured via app.json entitlements).

import ExpoModulesCore
import Foundation

public class ICloudBackupModule: Module {
  private let queue = DispatchQueue(label: "app.hablits.icloudbackup", qos: .utility)

  public func definition() -> ModuleDefinition {
    Name("ICloudBackup")

    // true when the user is signed into iCloud and the container is reachable
    AsyncFunction("isAvailable") { (promise: Promise) in
      queue.async {
        promise.resolve(self.documentsURL() != nil)
      }
    }

    // Writes atomically; creates the Documents directory if needed.
    AsyncFunction("writeFile") { (name: String, contents: String, promise: Promise) in
      queue.async {
        guard let dir = self.documentsURL() else {
          promise.reject("E_ICLOUD_UNAVAILABLE", "iCloud is not available")
          return
        }
        do {
          try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
          let url = dir.appendingPathComponent(name)
          try contents.write(to: url, atomically: true, encoding: .utf8)
          promise.resolve(url.absoluteString)
        } catch {
          promise.reject("E_WRITE", error.localizedDescription)
        }
      }
    }

    // Returns the file's contents, or null if it doesn't exist (yet — iCloud
    // may still be downloading it; we kick off a download request).
    AsyncFunction("readFile") { (name: String, promise: Promise) in
      queue.async {
        guard let dir = self.documentsURL() else {
          promise.reject("E_ICLOUD_UNAVAILABLE", "iCloud is not available")
          return
        }
        let url = dir.appendingPathComponent(name)
        let fm = FileManager.default
        if !fm.fileExists(atPath: url.path) {
          // Ask iCloud to fetch it if it exists on another device
          try? fm.startDownloadingUbiquitousItem(at: url)
          promise.resolve(nil)
          return
        }
        do {
          let text = try String(contentsOf: url, encoding: .utf8)
          promise.resolve(text)
        } catch {
          promise.reject("E_READ", error.localizedDescription)
        }
      }
    }

    // ISO-8601 modification date of the file, or null
    AsyncFunction("modifiedAt") { (name: String, promise: Promise) in
      queue.async {
        guard let dir = self.documentsURL() else {
          promise.resolve(nil)
          return
        }
        let url = dir.appendingPathComponent(name)
        guard let attrs = try? FileManager.default.attributesOfItem(atPath: url.path),
              let date = attrs[.modificationDate] as? Date else {
          promise.resolve(nil)
          return
        }
        promise.resolve(ISO8601DateFormatter().string(from: date))
      }
    }
  }

  private func documentsURL() -> URL? {
    // nil container identifier = the first container in the entitlement
    return FileManager.default.url(forUbiquityContainerIdentifier: nil)?.appendingPathComponent("Documents")
  }
}
