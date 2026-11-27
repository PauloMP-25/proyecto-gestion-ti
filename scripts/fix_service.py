path = "backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/aplicacion/impl/SolicitudCambioServiceImpl.java"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

fixed = content.replace("(a, b) => a + \" \" + b", "(a, b) -> a + \" \" + b")

with open(path, "w", encoding="utf-8") as f:
    f.write(fixed)
print("Fixed service lambda successfully")
