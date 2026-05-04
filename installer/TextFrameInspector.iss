#define MyAppName "Text Frame Inspector"
#define MyAppVersion GetEnv("TFI_VERSION")
#define MyAppPublisher "Text Frame Inspector"
#define MyAppURL "https://github.com/OWNER/REPO"
#define SourceRoot GetEnv("TFI_STAGE_ROOT")

[Setup]
AppId={{8B7E6C72-6AE2-4E9E-9B30-2B26CF79E7D1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={userappdata}\Adobe\CEP\extensions\TextFrameInspector
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=..\release
OutputBaseFilename=TextFrameInspector-Setup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayName={#MyAppName}
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=Adobe Illustrator CEP extension for inspecting text frames

[Files]
Source: "{#SourceRoot}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[InstallDelete]
Type: filesandordirs; Name: "{app}"

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Run]
Filename: "{cmd}"; Parameters: "/c echo Installation complete. Restart Illustrator before opening Text Frame Inspector."; Flags: runhidden
