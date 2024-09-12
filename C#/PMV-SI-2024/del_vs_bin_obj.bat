@echo off

rmdir /s /q "GestaoMedicamentos\.vs"
rmdir /s /q "GestaoMedicamentos\bin"
rmdir /s /q "GestaoMedicamentos\obj"

rmdir /s /q "GestaoMedicamentos.API\bin"
rmdir /s /q "GestaoMedicamentos.API\obj"

rmdir /s /q "GestaoMedicamentos.Produto\bin"
rmdir /s /q "GestaoMedicamentos.Produto\obj"

rmdir /s /q "GestaoMedicamentos.Relatorios\bin"
rmdir /s /q "GestaoMedicamentos.Relatorios\obj"

rmdir /s /q "GestaoMedicamentos.Web\bin"
rmdir /s /q "GestaoMedicamentos.Web\obj"

echo Pastas deletadas com sucesso!
pause
