Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get current directory of the script
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Copy Path to Clipboard (Hidden)
' We use a hidden cmd call just to pipe to clip, user won't see it (window style 0)
strCmd = "cmd /c echo " & strPath & "| clip"
objShell.Run strCmd, 0, True

' Open Chrome Extensions Page
objShell.Run "chrome chrome://extensions"

' Show Friendly Instructions via Native Windows Dialog (SystemModal to force on top)
msg = "ALMOST THERE!" & vbCrLf & vbCrLf & _
      "1. If asked 'Who's using Chrome?', click your profile now." & vbCrLf & _
      "2. On the Extensions page: Click 'Load Unpacked' (Top Left)." & vbCrLf & _
      "3. Press Ctrl+V (Paste) to select the folder." & vbCrLf & vbCrLf & _
      "Click OK to close this helper."

' 4096 = SystemModal (Always on Top), 64 = Info Icon
MsgBox msg, 4160, "SecureSentinel Setup Helper"
