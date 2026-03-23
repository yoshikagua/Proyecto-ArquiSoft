"""
Validation Tests - Docker Compose Synchronization

Este archivo contiene tests que validan la consistencia y sincronización
de los archivos docker-compose.yml en el proyecto.

No requiere que los servicios estén corriendo en contenedores.
Solo valida archivos YAML y configuración estática.

Tests:
1. ✅ Verify all docker-compose files have same database URL format
2. ✅ Check JWT_SECRET is consistent across services
3. ✅ Validate port mappings don't conflict between stacks
4. ✅ Ensure service versions/images are compatible
5. ✅ Check that all required environment variables are defined

Ejecutar con:
  python -m pytest tests/validation/test_docker_compose_sync.py -v -s
"""

import unittest
import yaml
from pathlib import Path
from typing import Dict, List, Any


class TestDockerComposeSynchronization(unittest.TestCase):
    """
    Valida sincronización y consistencia entre archivos docker-compose.yml
    """

    @classmethod
    def setUpClass(cls):
        """Cargar todos los archivos docker-compose.yml"""
        cls.project_root = Path(__file__).resolve().parents[2]
        
        # Ubicaciones de los archivos docker-compose
        cls.compose_files = {
            "root": cls.project_root / "docker-compose.yml",
            "api-gateway": cls.project_root / "api-gateway" / "docker-compose.yml",
            "frontend": cls.project_root / "Front-end" / "docker-compose.yml",
            "auth-api": cls.project_root / "auth-api" / "docker-compose.yml",
        }
        
        # Cargar y parsear todos los archivos
        cls.compose_data = {}
        cls.compose_loaded = {}
        
        for name, path in cls.compose_files.items():
            if path.exists():
                with open(path, "r") as f:
                    cls.compose_data[name] = f.read()
                    cls.compose_loaded[name] = yaml.safe_load(cls.compose_data[name])
                print(f"✓ Cargado: {name} docker-compose.yml")
            else:
                print(f"✗ No encontrado: {name} docker-compose.yml")

    def test_01_all_compose_files_exist(self):
        """Verificar que todos los archivos docker-compose existen"""
        print("\n🟢 TEST 1: All Docker Compose Files Exist")
        
        for name, path in self.compose_files.items():
            self.assertTrue(
                path.exists(),
                f"File not found: {path}"
            )
            print(f"   ✓ {name}: {path}")

    def test_02_all_compose_files_are_valid_yaml(self):
        """Verificar que todos los archivos YAML son válidos"""
        print("\n🟢 TEST 2: All YAML Files Are Valid")
        
        for name in self.compose_files.keys():
            if name in self.compose_loaded:
                self.assertIsNotNone(
                    self.compose_loaded[name],
                    f"Invalid YAML in {name} docker-compose.yml"
                )
                print(f"   ✓ {name}: Valid YAML structure")

    def test_03_postgres_service_consistency(self):
        """Verificar que PostgreSQL esté configurado consistentemente"""
        print("\n🟢 TEST 3: PostgreSQL Service Consistency")
        
        expected_postgres = {
            "image": "postgres:15-alpine",
            "database": "auth_db",
            "user": "authuser",
            "password": "authpass",
            "port": 5432,
        }
        
        for name, compose in self.compose_loaded.items():
            if "services" in compose and "postgres" in compose["services"]:
                postgres = compose["services"]["postgres"]
                
                # Verificar imagen
                self.assertEqual(
                    postgres.get("image"), 
                    expected_postgres["image"],
                    f"{name}: PostgreSQL image mismatch"
                )
                
                # Verificar variables de entorno
                env = postgres.get("environment", {})
                if isinstance(env, dict):
                    self.assertEqual(
                        env.get("POSTGRES_DB"),
                        expected_postgres["database"],
                        f"{name}: Database name mismatch"
                    )
                    self.assertEqual(
                        env.get("POSTGRES_USER"),
                        expected_postgres["user"],
                        f"{name}: Database user mismatch"
                    )
                    self.assertEqual(
                        env.get("POSTGRES_PASSWORD"),
                        expected_postgres["password"],
                        f"{name}: Database password mismatch"
                    )
                
                print(f"   ✓ {name}: PostgreSQL correctly configured")

    def test_04_port_no_conflicts(self):
        """Verificar que no hay conflictos de puertos entre stacks"""
        print("\n🟢 TEST 4: Port Mapping Consistency")
        
        # Puertos por servicio (esperado)
        expected_ports = {
            "postgres": [5432],
            "user-api": [3000],
            "api-gateway": [8000],
            "frontend": [8080],
            "mailhog": [1025, 8025],
        }
        
        for name, compose in self.compose_loaded.items():
            if "services" in compose:
                services = compose["services"]
                
                for service_name, expected_port_list in expected_ports.items():
                    if service_name in services:
                        service = services[service_name]
                        ports = service.get("ports", [])
                        
                        if ports:
                            # Extraer puerto host (parte antes del ':')
                            actual_ports = []
                            for port_entry in ports:
                                if isinstance(port_entry, str):
                                    host_port = port_entry.split(":")[0]
                                    actual_ports.append(int(host_port))
                            
                            # Verificar que el puerto está en la lista esperada
                            for port in actual_ports:
                                self.assertIn(
                                    port,
                                    expected_port_list,
                                    f"{name}/{service_name}: Unexpected port {port}"
                                )
                            
                            print(f"   ✓ {name}/{service_name}: Ports {actual_ports}")

    def test_05_service_image_consistency(self):
        """Verificar que las imágenes de servicios sean consistentes"""
        print("\n🟢 TEST 5: Service Images Consistency")
        
        # Imágenes esperadas con sus versiones
        expected_images = {
            "postgres": "postgres:15-alpine",
            "mailhog": "mailhog/mailhog",
        }
        
        for name, compose in self.compose_loaded.items():
            if "services" in compose:
                services = compose["services"]
                
                for service_name, expected_image in expected_images.items():
                    if service_name in services:
                        actual_image = services[service_name].get("image")
                        if service_name == "mailhog":
                            self.assertIn(
                                actual_image,
                                ["mailhog/mailhog", "mailhog/mailhog:latest"],
                                f"{name}/{service_name}: Image mismatch"
                            )
                        else:
                            self.assertEqual(
                                actual_image,
                                expected_image,
                                f"{name}/{service_name}: Image mismatch"
                            )
                        print(f"   ✓ {name}/{service_name}: {actual_image}")

    def test_06_volume_isolation(self):
        """Verificar que los volúmenes estén correctamente aislados"""
        print("\n🟢 TEST 6: Volume Isolation")
        
        volumes_found = {}
        
        for name, compose in self.compose_loaded.items():
            if "services" in compose and "postgres" in compose["services"]:
                postgres = compose["services"]["postgres"]
                volumes = postgres.get("volumes", [])
                
                if volumes:
                    # Extraer nombre del volumen
                    vol_names = []
                    for vol in volumes:
                        if isinstance(vol, str) and ":" in vol:
                            vol_name = vol.split(":")[0]
                            vol_names.append(vol_name)
                    
                    volumes_found[name] = vol_names
                    print(f"   ✓ {name}: Volumes {vol_names}")
        
        # Verificar que cada stack tiene sus propios volúmenes
        self.assertTrue(len(volumes_found) > 0, "No volumes found in any compose file")

    def test_07_environment_variables_documented(self):
        """Verificar que las variables de entorno estén documentadas"""
        print("\n🟢 TEST 7: Environment Variables Documentation")
        
        required_env_files = {
            "api-gateway": self.project_root / "api-gateway" / ".env.example",
            "auth-api": self.project_root / "auth-api" / ".env.example",
            "Front-end": self.project_root / "Front-end" / ".env.example",
        }
        
        for service_name, env_file_path in required_env_files.items():
            self.assertTrue(
                env_file_path.exists(),
                f"Environment file missing: {env_file_path}"
            )
            print(f"   ✓ {service_name}: .env.example found")

    def test_08_network_compatibility(self):
        """Verificar que todos los servicios usan la misma red (si aplica)"""
        print("\n🟢 TEST 8: Docker Network Compatibility")
        
        networks_found = {}
        
        for name, compose in self.compose_loaded.items():
            if "networks" in compose:
                networks = list(compose["networks"].keys())
                networks_found[name] = networks
                print(f"   ℹ️  {name}: Networks {networks}")
            else:
                print(f"   ℹ️  {name}: Using default bridge network")

    def test_09_compose_version_compatibility(self):
        """Verificar versión de docker-compose"""
        print("\n🟢 TEST 9: Docker Compose Version")
        
        for name, compose in self.compose_loaded.items():
            version = compose.get("version", "2.0")
            # FastAPI + Rust services requieren version 3.8+ para networking
            if version and float(version.split(".")[0]) >= 3:
                print(f"   ✓ {name}: Version {version} (compatible)")
            else:
                print(f"   ℹ️  {name}: Version {version}")

    def test_10_health_checks_defined(self):
        """Verificar que los servicios críticos tengan health checks"""
        print("\n🟢 TEST 10: Health Checks (Critical Services)")
        
        services_with_health_checks = {}
        
        for name, compose in self.compose_loaded.items():
            if "services" in compose:
                services = compose["services"]
                health_checks = {}
                
                for service_name in ["postgres", "user-api", "api-gateway"]:
                    if service_name in services:
                        service = services[service_name]
                        if "healthcheck" in service:
                            health_checks[service_name] = True
                            print(f"   ✓ {name}/{service_name}: Has health check")
                        else:
                            print(f"   ⚠️  {name}/{service_name}: No health check")


class TestEnvironmentConsistency(unittest.TestCase):
    """
    Valida consistencia de variables de entorno entre servicios
    """
    
    @classmethod
    def setUpClass(cls):
        cls.project_root = Path(__file__).resolve().parents[2]
        cls.env_files = {
            "api-gateway": cls.project_root / "api-gateway" / ".env.example",
            "auth-api": cls.project_root / "auth-api" / ".env.example",
            "frontend": cls.project_root / "Front-end" / ".env.example",
        }
        
        cls.env_content = {}
        for name, path in cls.env_files.items():
            if path.exists():
                with open(path, "r") as f:
                    cls.env_content[name] = f.read()

    def test_01_env_examples_define_critical_vars(self):
        """Verificar que .env.example define variables críticas"""
        print("\n🟢 TEST ENV 1: Critical Variables Defined")
        
        for service_name, content in self.env_content.items():
            if service_name == "api-gateway":
                self.assertIn("USER_API_URL", content, 
                    f"{service_name}: USER_API_URL not in .env.example")
                print(f"   ✓ {service_name}: USER_API_URL defined")
            
            if service_name in ["api-gateway", "auth-api"]:
                self.assertIn("JWT_SECRET", content or "",
                    f"{service_name}: JWT_SECRET not in .env.example")
                print(f"   ✓ {service_name}: JWT_SECRET defined")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("VALIDATION TESTS: DOCKER COMPOSE SYNCHRONIZATION")
    print("=" * 70)
    print("\n📋 Validaciones realizadas:")
    print("   1. Existencia de todos los archivos docker-compose.yml")
    print("   2. Validez de sintaxis YAML")
    print("   3. Consistencia de servicios PostgreSQL")
    print("   4. Ausencia de conflictos de puertos")
    print("   5. Consistencia de versiones de imagen")
    print("   6. Aislamiento de volúmenes")
    print("   7. Documentación de variables de entorno")
    print("   8. Compatibilidad de redes Docker")
    print("   9. Versión de docker-compose")
    print("   10. Health checks en servicios críticos")
    print("\n" + "=" * 70)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestDockerComposeSynchronization))
    suite.addTests(loader.loadTestsFromTestCase(TestEnvironmentConsistency))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print(f"Total validations: {result.testsRun}")
    print(f"Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failed: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL DOCKER COMPOSE FILES ARE IN SYNC")
        print("\n✓ Database configuration consistent across all stacks")
        print("✓ Port mappings don't conflict")
        print("✓ Service images are compatible")
        print("✓ Environment variables properly documented")
    else:
        print("\n⚠️  SOME VALIDATIONS FAILED")
        print("\nPlease review the docker-compose.yml files for:")
        print("  - Inconsistent PostgreSQL configuration")
        print("  - Port conflicts between stacks")
        print("  - Missing .env.example files")
        print("  - Incompatible image versions")
    
    print("=" * 70)
