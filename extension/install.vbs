Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get current directory
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Copy Path to Clipboard (Silent & Reliable)
psCmd = "powershell -windowstyle hidden -Command ""Set-Clipboard -Value '" & strPath & "'"""
objShell.Run psCmd, 0, True

' --- ROBUST CHROME DISCOVERY ---
chromePath = ""
On Error Resume Next
chromePath = objShell.RegRead("HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe\")
If chromePath = "" Then chromePath = objShell.RegRead("HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe\")
On Error GoTo 0

If chromePath = "" Then
    p1 = objShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe"
    p2 = objShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe"
    If objFSO.FileExists(p1) Then chromePath = p1 Else If objFSO.FileExists(p2) Then chromePath = p2
End If

' --- SINGLE-STRIKE SMART LAUNCH ---
' We launch with --new-window to ensure it doesn't get buried and use the protocol directly.
If chromePath <> "" Then
    ' High-reliability single command
    objShell.Run """" & chromePath & """ --new-window chrome://extensions", 1, False
Else
    ' System fallback
    objShell.Run "cmd /c start chrome ""chrome://extensions""", 0, False
End If

' Single, Professional Completion Notify
msg = "SENTINEL DEPLOYMENT" & vbCrLf & vbCrLf & _
      "1. Extension page is now open." & vbCrLf & _
      "2. Click 'Load Unpacked'." & vbCrLf & _
      "3. Press Ctrl+V and select the folder."

MsgBox msg, 64, "SecureSentinel"
