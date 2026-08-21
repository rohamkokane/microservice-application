pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Docker Compose') {
            steps {
                bat 'docker compose config -q'
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Smoke Test') {
            steps {
                bat 'docker compose up -d'

                retry(10) {
                    sleep 2
                    bat 'curl --fail http://localhost:3000/health'
                }
            }
        }

        stage('Check Docker Credential') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    bat '''
                        powershell -NoProfile -Command "$bytes=[Text.Encoding]::UTF8.GetBytes($env:DOCKER_TOKEN); $hash=[Security.Cryptography.SHA256]::Create().ComputeHash($bytes); Write-Host ('Username: ' + $env:DOCKER_USER); Write-Host ('Token SHA256: ' + [BitConverter]::ToString($hash).Replace('-', ''))"
                    '''
                }
            }
        }

        stage('ECR Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    bat '''
                        powershell -NoProfile -Command "$env:DOCKER_TOKEN | docker login -u $env:DOCKER_USER --password-stdin"
                    '''
                }
            }
        }

        stage('Tag Docker Images') {
            steps {
                bat 'docker tag luminaci-cd-api-gateway roham132/lumina-api-gateway:latest'
                bat 'docker tag luminaci-cd-auth-service roham132/lumina-auth-service:latest'
                bat 'docker tag luminaci-cd-task-service roham132/lumina-task-service:latest'
                bat 'docker tag luminaci-cd-frontend roham132/lumina-frontend:latest'
            }
        }

        stage('Push Docker Images') {
            steps {
                bat 'docker push roham132/lumina-api-gateway:latest'
                bat 'docker push roham132/lumina-auth-service:latest'
                bat 'docker push roham132/lumina-task-service:latest'
                bat 'docker push roham132/lumina-frontend:latest'
            }
        }
    }
}