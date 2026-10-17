// Minimal iCloud Documents access for Hablits backups.
//
// Why a local module: expo-file-system can't reach the ubiquity container.
// Four functions — isAvailable, writeFile, readFile, modifiedAt — on a
// background queue, with NSFileCoordinator around every touch of the
// container (required for iCloud Documents; avoids NSFileVersion conflicts).
//
// readFile WAITS for iCloud to download the file: on a fresh device the item
// is a ".name.icloud" placeholder (or metadata hasn't synced yet). We poll
// for up to `timeoutMs`, triggering the download, before giving up with nil.
//
// Requires the iCloud capability with "iCloud Documents" and a container
// named iCloud.<bundleIdentifier> (configured via app.json entitlements).

import ExpoModulesCore
import Foundation

public class ICloudBackupModule: Module {
  private let queue = DispatchQueue(label: "app.hablits.icloudbackup", qos: .utility)

  public func definition() -> ModuleDefinition {
    Name("ICloudBackup")

    AsyncFunction("isAvailable") { (promise: Promise) in
      queue.async {
        promise.resolve(self.documentsURL() != nil)
      }
    }

    AsyncFunction("writeFile") { (name: String, contents: String, promise: Promise) in
      queue.async {
        guard let dir = self.documentsURL() else {
          promise.reject("E_ICLOUD_UNAVAILABLE", "iCloud is not available")
          return
        }
        let url = dir.appendingPathComponent(name)
        var coordError: NSError?
        var writeError: Error?
        NSFileCoordinator().coordinate(writingItemAt: url, options: .forReplacing, error: &coordError) { target in
          do {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try contents.write(to: target, atomically: true, encoding: .utf8)
          } catch {
            writeError = error
          }
        }
        if let e = coordError ?? (writeError as NSError?) {
          promise.reject("E_WRITE", e.localizedDescription)
        } else {
          promise.resolve(url.absoluteString)
        }
      }
    }

    // Resolves the file's contents, or nil if it doesn't exist (after waiting
    // up to timeoutMs for iCloud to deliver it).
    AsyncFunction("readFile") { (name: String, timeoutMs: Double, promise: Promise) in
      queue.async {
        guard let dir = self.documentsURL() else {
          promise.reject("E_ICLOUD_UNAVAILABLE", "iCloud is not available")
          return
        }
        let url = dir.appendingPathComponent(name)
        let placeholder = dir.appendingPathComponent(".\(name).icloud")
        let fm = FileManager.default
        let deadline = Date().addingTimeInterval(max(0, timeoutMs) / 1000)

        repeat {
          if fm.fileExists(atPath: url.path) {
            // Make sure it's fully downloaded, not just present
            let status = (try? url.resourceValues(forKeys: [.ubiquitousItemDownloadingStatusKey]))?.ubiquitousItemDownloadingStatus
            if status == nil || status == .current || status == .downloaded {
              var coordError: NSError?
              var text: String?
              var readError: Error?
              NSFileCoordinator().coordinate(readingItemAt: url, options: [], error: &coordError) { target in
                do { text = try String(contentsOf: target, encoding: .utf8) } catch { readError = error }
              }
              if let e = coordError ?? (readError as NSError?) {
                promise.reject("E_READ", e.localizedDescription)
              } else {
                promise.resolve(text)
              }
              return
            }
          }
          if fm.fileExists(atPath: placeholder.path) || fm.fileExists(atPath: url.path) {
            try? fm.startDownloadingUbiquitousItem(at: url)
          }
          if Date() >= deadline { break }
          Thread.sleep(forTimeInterval: 0.4)
        } while true

        promise.resolve(nil)
      }
    }

    // ISO-8601 content modification date, or nil. Works for undownloaded
    // items too (metadata is available before the content).
    AsyncFunction("modifiedAt") { (name: String, promise: Promise) in
      queue.async {
        guard let dir = self.documentsURL() else {
          promise.resolve(nil)
          return
        }
        let url = dir.appendingPathComponent(name)
        let placeholder = dir.appendingPathComponent(".\(name).icloud")
        let candidate = FileManager.default.fileExists(atPath: url.path) ? url : placeholder
        guard let values = try? candidate.resourceValues(forKeys: [.contentModificationDateKey]),
              let date = values.contentModificationDate else {
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
