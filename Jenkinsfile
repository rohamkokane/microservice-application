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

        stage('Check AWS') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'AWS-access',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    bat '''
                        whoami
                        aws --version
                        aws sts get-caller-identity
                    '''
                }
            }
        }

        stage('ECR Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'AWS-access',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    bat '''
                        for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i

                        aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com
                    '''
                }
            }
        }

        stage('Tag Docker Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'AWS-access',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    bat '''
                        for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i

                        docker tag luminaci-cd-api-gateway %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-api-gateway:latest

                        docker tag luminaci-cd-auth-service %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-auth-service:latest

                        docker tag luminaci-cd-task-service %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-task-service:latest

                        docker tag luminaci-cd-frontend %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-frontend:latest
                    '''
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'AWS-access',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    bat '''
                        for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i

                        docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-api-gateway:latest

                        docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-auth-service:latest

                        docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-task-service:latest

                        docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/lumina-frontend:latest
                    '''
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'AWS-access',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    bat '''
                        aws ecs update-service --cluster lumina-cluster --service lumina-api-gateway --force-new-deployment --region %AWS_REGION%

                        aws ecs update-service --cluster lumina-cluster --service lumina-auth-service --force-new-deployment --region %AWS_REGION%

                        aws ecs update-service --cluster lumina-cluster --service lumina-task-service --force-new-deployment --region %AWS_REGION%

                        aws ecs update-service --cluster lumina-cluster --service lumina-frontend --force-new-deployment --region %AWS_REGION%
                    '''
                }
            }
        }
    }
}