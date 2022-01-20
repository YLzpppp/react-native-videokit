require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-videokit"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-videokit
                   DESC
  s.homepage     = "https://github.com/yaaliuzhipeng/react-native-videokit"
  # brief license entry:
  s.license      = "MIT"
  # optional - use expanded license entry instead:
  # s.license    = { :type => "MIT", :file => "LICENSE" }
  s.authors      = { "yaaliuzhipeng" => "yaaliuzhipeng@outlook.com" }
  s.platforms    = { :ios => "10.0" }
  s.source       = { :git => "https://github.com/yaaliuzhipeng/react-native-videokit.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,c,m,swift}"
  s.requires_arc = true

  s.dependency "React"
  s.dependency "GCDWebServer", "~> 3.0"
  # ...
  # s.dependency "..."
end

