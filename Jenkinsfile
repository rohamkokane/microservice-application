pipeline {
    agent any

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
                sh 'docker compose build'
            }
        }

        stage('smoke test') {
            steps {
                sh 'docker compose up -d'
                retry(10) {
                sleep 2
                sh 'curl --fail http://localhost:3000/health'
                }

            
            }
        }

        stage('docker login'){
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-cerdentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    sh 'echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Tag Docker Images') {
            steps {
                sh 'docker tag microservice-application-api-gateway roham132/lumina-api-gateway:latest'
                sh 'docker tag microservice-application-auth-service roham132/lumina-auth-service:latest'
                sh 'docker tag microservice-application-task-service roham132/lumina-task-service:latest'
                sh 'docker tag microservice-application-frontend roham132/lumina-frontend:latest'
            }
        }

        stage('Push Docker Images') {
            steps {
                sh 'docker push roham132/lumina-api-gateway:latest'
                sh 'docker push roham132/lumina-auth-service:latest'
                sh 'docker push roham132/lumina-task-service:latest'
                sh 'docker push roham132/lumina-frontend:latest'
            }
        }
    }
}