import UIKit
import React

@objc(ScreenRecordingProtector)
class ScreenRecordingProtector: RCTEventEmitter {
  
  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(screenCaptureStatusChanged),
      name: UIScreen.capturedDidChangeNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  @objc func isScreenRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(UIScreen.main.isCaptured)
    }
  }

  @objc func screenCaptureStatusChanged() {
    let isRecording = UIScreen.main.isCaptured
    sendEvent(withName: "onScreenRecordingChanged", body: ["isRecording": isRecording])
  }

  override func supportedEvents() -> [String]! {
    return ["onScreenRecordingChanged"]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
