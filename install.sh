#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting OCI Deployment Setup..."

# 1. Update system
sudo apt-get update
sudo apt-get upgrade -y

# 2. Install Docker using official repo
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Add current user to docker group
sudo usermod -aG docker $USER

# 4. Open Local Firewall (ufw or iptables - OCI uses iptables by default)
# Note: Ingress rules in OCI Console are ALSO required.
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ Docker installed and Firewall configured."
echo "⚠️ Please log out and log back in to apply docker group changes."
echo "👉 After logging back in, run: docker compose up -d --build"
