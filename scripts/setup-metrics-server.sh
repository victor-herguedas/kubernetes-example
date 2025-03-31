#!/bin/bash

set -e

echo "📥 Instalando metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "🛠️ Parcheando metrics-server para permitir --kubelet-insecure-tls..."
kubectl patch deployment metrics-server -n kube-system \
  --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

echo "⏳ Esperando que el metrics-server esté listo..."
kubectl rollout status deployment metrics-server -n kube-system

echo "🧪 Verificando métricas disponibles..."
sleep 5
kubectl top pods || echo "⚠️ Aún no hay métricas disponibles. Espera unos segundos y vuelve a intentar."

echo "📊 Estado actual de los HPA:"
kubectl get hpa

echo "✅ Metrics-server listo. HPA debería empezar a funcionar pronto si hay carga suficiente."
