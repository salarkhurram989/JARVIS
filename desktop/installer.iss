[Setup]
AppId={{8E6E1D8E-7C1E-4D3D-A8C0-JARVISPCAGENT}}
AppName=JARVIS PC Agent
AppVersion=2.0.0
AppPublisher=Salar Khurram
DefaultDirName={autopf}\JARVIS PC Agent
DefaultGroupName=JARVIS PC Agent
OutputDir=installer
OutputBaseFilename=JARVIS-Setup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName=JARVIS PC Agent

[Files]
Source: "..\dist\JARVIS-PC-Agent.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autodesktop}\JARVIS"; Filename: "{app}\JARVIS-PC-Agent.exe"; WorkingDir: "{app}"
Name: "{group}\JARVIS"; Filename: "{app}\JARVIS-PC-Agent.exe"; WorkingDir: "{app}"
Name: "{group}\Uninstall JARVIS"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\JARVIS-PC-Agent.exe"; Description: "Launch JARVIS PC Agent"; Flags: nowait postinstall skipifsilent
