import Foundation
import Capacitor

@objc(SecurityPlugin)
public class SecurityPlugin: CAPPlugin {
    
    public override func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(self.handleSecurityViolation(_:)), name: Notification.Name("SecurityViolation"), object: nil)
    }
    
    @objc func handleSecurityViolation(_ notification: Notification) {
        if let type = notification.userInfo?["type"] as? String {
            self.notifyListeners("securityViolation", data: [
                "type": type,
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ])
        }
    }
}
