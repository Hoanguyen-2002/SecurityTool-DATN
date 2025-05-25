# Security Tool Setup Guide

This document walks you through:

1. Installing and running **SonarQube** in Docker  
2. Performing an initial **static analysis** of your Spring Boot backend with SonarQube  
3. Installing and running **OWASP ZAP** in Docker (daemon mode on port 8080)  
4. Verifying both tools are up and reachable

---

## Prerequisites

- **Docker** installed and running  
- **Java** (JDK 17+) and **Maven** installed  
- Free ports **9000** (SonarQube) and **8080** (ZAP) on your host
- Run ```yarn install``` to install node modules and ```yarn start``` to run front-end
- Back-end run on 8081 port
---

## 1. Install & Run SonarQube

1. **Pull the SonarQube LTS Community image**  
    ```bash
   docker pull sonarqube:lts-ccommunity
    ```
    
   ```bash
   docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-ccommunity
    ````

## 2. Install and Run Owasp Zap
1. **Run below command on IntelliJ IDEA to test project by SonarQube**

```bash
   mvn clean verify sonar:sonar -Dsonar.host.url=http://localhost:9000" "-Dsonar.projectKey=Bookstore-ecommerce" "-Dsonar.login=sqp_ba790b7c22ad4edf5eba0a855e80c7b8255ab659" -DskipTests
```

2. **Run Owasp Zap image on docker**

```bash 
docker run -d -u zap -p 8080:8080 --name zap-stable zaproxy/zap-stable zap-x.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true -config api.addrs.addr.name=".*" -config api.addrs.addr.regex=true
```
3. **Verify ZAP API** 
```bash 
curl http://localhost:8080/JSON/core/view/version 
```
