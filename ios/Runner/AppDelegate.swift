import AVKit
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    engineBridge.pluginRegistry.registrar(forPlugin: "RoutePicker")?
      .register(RoutePickerFactory(), withId: RoutePickerFactory.viewType)
  }
}

/// The system's picker for where audio plays (AirPlay, Bluetooth, the
/// phone), shown in the player as a platform view (see `_OutputPicker` in
/// player_screen.dart). Its only argument is the icon's colour.
final class RoutePickerFactory: NSObject, FlutterPlatformViewFactory {
  static let viewType = "languagetransfer/route-picker"

  func create(
    withFrame frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?
  ) -> FlutterPlatformView {
    let color = (args as? [String: Any])?["color"] as? Int
    return RoutePicker(frame: frame, argb: color)
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    FlutterStandardMessageCodec.sharedInstance()
  }
}

final class RoutePicker: NSObject, FlutterPlatformView {
  private let picker: AVRoutePickerView

  init(frame: CGRect, argb: Int?) {
    picker = AVRoutePickerView(frame: frame)
    picker.backgroundColor = .clear
    picker.prioritizesVideoDevices = false
    if let argb {
      let color = UIColor(
        red: CGFloat((argb >> 16) & 0xFF) / 255,
        green: CGFloat((argb >> 8) & 0xFF) / 255,
        blue: CGFloat(argb & 0xFF) / 255,
        alpha: CGFloat((argb >> 24) & 0xFF) / 255
      )
      picker.tintColor = color
      picker.activeTintColor = color
    }
    super.init()
  }

  func view() -> UIView { picker }
}
