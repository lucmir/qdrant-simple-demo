
# Qdrant simple demo

Simple test with Qdrant.

## How to run it

Start Qdrant server using Docker:
```
docker pull qdrant/qdrant
docker run -p 6333:6333 qdrant/qdrant
```

You can access a dashboard at _http://localhost:6333/dashboard_.

Install the project:
```
yarn install
```

Run the project:
```
node index.js
```

It will create a collection named "astronomy", populate it with 5 small articles and query it.
The result of the queries will be printed out in the console.
