import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var blurEffectView: UIVisualEffectView?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        setupSecurityObservers()
        return true
    }

    func setupSecurityObservers() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleScreenCapture), name: UIScreen.capturedDidChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleScreenshot), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
    }

    @objc func handleScreenCapture() {
        if UIScreen.main.isCaptured {
            showBlurOverlay()
        } else {
            hideBlurOverlay()
        }
    }

    @objc func handleScreenshot() {
        let alert = UIAlertController(title: "Security Warning", message: "Screenshots are prohibited.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        
        if let rootVC = window?.rootViewController {
            rootVC.present(alert, animated: true, completion: nil)
        }
        
        // Notify the Capacitor plugin via NSNotification
        NotificationCenter.default.post(name: Notification.Name("SecurityViolation"), object: nil, userInfo: ["type": "screenshot_attempt"])
    }

    func showBlurOverlay() {
        guard let window = self.window else { return }
        let blurEffect = UIBlurEffect(style: .dark)
        blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView?.frame = window.bounds
        blurEffectView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(blurEffectView!)
    }

    func hideBlurOverlay() {
        blurEffectView?.removeFromSuperview()
        blurEffectView = nil
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Blur the app content before iOS takes the App Switcher snapshot,
        // preventing sensitive content from appearing in the multitasking tray.
        showBlurOverlay()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Remove the blur overlay when the app returns to the foreground.
        hideBlurOverlay()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
