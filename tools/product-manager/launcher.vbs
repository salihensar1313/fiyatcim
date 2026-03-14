Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\salih\OneDrive\MASAST~1\claude2\tools\product-manager"
WshShell.Run "pythonw main.py", 0, False
