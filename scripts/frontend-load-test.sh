#!/bin/bash

URL="http://localhost/front"

# Número de rondas brutales
ROUNDS=20

# Peticiones por ronda (¡empieza fuerte!)
START_REQS=1000
INCREMENT=1000

# Altísima concurrencia
CONCURRENCY=200

echo "💥 INICIO de carga extrema contra $URL"

for (( i=1; i<=ROUNDS; i++ ))
do
  REQS=$((START_REQS + (i - 1) * INCREMENT))
  echo "🔥 Ronda $i: Enviando $REQS peticiones (con $CONCURRENCY concurrencia)..."

  seq $REQS | xargs -n1 -P$CONCURRENCY curl -s -o /dev/null "$URL"

  echo "⏳ Esperando solo 2 segundos antes de la siguiente ronda..."
  sleep 2
done

echo "🏁 Carga extrema finalizada."
