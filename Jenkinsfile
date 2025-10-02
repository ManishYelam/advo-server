pipeline {
    agent any

    environment {
        IMAGE_NAME = "manishyelam/myserverapp:latest"
    }

    stages {
        stage('Build Start') {
            steps {
                script {
                    emailext (
                        subject: "🚀 Build Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: """\
                            <h2>🔧 Build Started</h2>
                            <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Git Branch:</strong> ${env.GIT_BRANCH}</p>
                            <p>⏳ The build process has begun...</p>
                        """,
                        mimeType: 'text/html',
                        to: 'manishyelam12e@gmail.com'
                    )
                }
            }
        }

        stage('Clone Repository') {
            steps {
                git branch: 'main', credentialsId: 'github-cred', url: 'https://github.com/ManishYelam/server.git'
            }
        }
        
        stage('Check Docker Access') {
            steps {
                 powershell 'docker --version'
            }
        }

        stage('Check Dockerfile') {
            steps {
                 powershell "Get-ChildItem -Force"
            }
        }

        stage('Build Docker Image') {
            steps {
                powershell "docker build -t ${env:IMAGE_NAME} ."
            }
        }

        stage('Build Complete') {
            steps {
                script {
                    emailext (
                        subject: "✅ Build Complete: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: """\
                            <h2>🎉 Build Completed Successfully</h2>
                            <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Status:</strong> ${currentBuild.currentResult}</p>
                            <p><strong>Docker Image:</strong> ${IMAGE_NAME}</p>
                            <p>✅ The build process has finished.</p>
                        """,
                        mimeType: 'text/html',
                        to: 'manishyelam12e@gmail.com'
                    )
                }
            }
        }
    }

    post {
        success {
            emailext (
                subject: "✅ Build Succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """\
                    <h2>🎉 Build Succeeded</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Docker Image:</strong> ${IMAGE_NAME}</p>
                    <p>🎯 The build completed successfully!</p>
                """,
                mimeType: 'text/html',
                to: 'manishyelam12e@gmail.com'
            )
        }
        failure {
            emailext (
                subject: "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """\
                    <h2>🚨 Build Failed</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p>⚠️ The build has failed. Please check the Jenkins job logs for more details.</p>
                """,
                mimeType: 'text/html',
                to: 'manishyelam12e@gmail.com'
            )
        }
    }
}
