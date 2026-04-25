!macro customUnInit
  Var /GLOBAL DeleteUserData
  StrCpy $DeleteUserData "0"
  MessageBox MB_YESNO|MB_ICONQUESTION "是否同时删除本地用户数据（设置、日志、草稿等）？" IDYES delete_data IDNO keep_data
  delete_data:
    StrCpy $DeleteUserData "1"
    Goto done
  keep_data:
    StrCpy $DeleteUserData "0"
  done:
!macroend

!macro customRemoveFiles
  ${if} $DeleteUserData == "1"
    RMDir /r "$APPDATA\sillytavern-cardforge"
    RMDir /r "$LOCALAPPDATA\sillytavern-cardforge"
  ${endif}
!macroend
