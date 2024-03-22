import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";

const client = new QdrantClient({
  url: 'http://localhost:6333',
});

async function recreateQdrantCollection(collectionName, vectorSize = 384) {
  console.log("Creating collection");
  try {
      await client.recreateCollection(collectionName, {
          vectors: {
              size: vectorSize,
              distance: "Dot"
          }
      });
      console.log(`Collection ${collectionName} created successfully`);
  } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
      throw error;
  }
}

// transfor text to vector
async function encodeText(text) {
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return await extractor(text, {pooling: "mean", normalize: true});
}

async function uploadDocument(collectionName, { id, text, title, metadata }) {
  // convert to point
  const vector = await encodeText(text);
  const point = {
    id,
    vector: vector.tolist()[0],
    payload: {
      text: text,
      title: title,
      metadata: metadata,
    },
  };
  try {
      await client.upsert(collectionName, { points: [point] });
      console.log(`Document ${id} uploaded successfully to collection '${collectionName}'`);
  } catch (error) {
      console.error(`Error uploading documents to collection '${collectionName}':`, error);
  }
};

async function searchArticles(collectionName, query, results = 1) {
  const vector = await encodeText(query); // Convert query text to vector

  try {
    const searchResults = await client.search(collectionName, {
      params: {
        hnsw_ef: 128,
        exact: false,
      },
      vector: vector.tolist()[0],
      limit: results, // Adjust limit as needed
    });
    return searchResults;
    // Further processing of searchResults as needed
  } catch (error) {
    console.error("Error during search:", error);
  }
};

const populateCollection = async (collectionName) => {
  console.log("Populating collection...");
  const articles = [
    {
      id: 1,
      title: "The Sun is a Star",
      text: "Our sun, which is the center of our solar system, is actually a very average-sized star among the billions of stars in the Milky Way galaxy.",
      metadata: { createdAt: new Date() },
    },
    {
      id: 2,
      title: "The Moon is Not a Star",
      text: "The Moon is Earth's only natural satellite and is the fifth largest moon in the solar system.",
      metadata: { createdAt: new Date() },
    },
    {
      id: 3,
      title: "Venus Rotates Backwards",
      text: "Unlike most planets in our solar system, Venus rotates on its axis in the opposite direction to its orbit around the Sun. This means that on Venus, the Sun would appear to rise in the west and set in the east.",
      metadata: { createdAt: new Date() },
    },
    {
      id: 4,
      title: "The Footprints on the Moon Will Last for Millions of Years",
      text: "Because the Moon has no atmosphere, there’s no wind or water to erode or wash away the Apollo astronauts’ footprints. They should last at least 10 million years.",
      metadata: { createdAt: new Date() },
    },
    {
      id: 5,
      title: "A Day on Venus is Longer than a Year",
      text: "Venus has a very slow rotation on its axis, taking about 243 Earth days to complete one rotation. However, it only takes about 225 Earth days to complete an orbit around the Sun. This means a day on Venus is longer than a year.",
      metadata: { createdAt: new Date() },
    },
  ];

  await Promise.all(articles.map(async (articles) => uploadDocument(collectionName, articles)));
};

(async () => {
  const collectionName = "astronomy";
  await recreateQdrantCollection(collectionName);
  await populateCollection(collectionName);

  const queries = [
    "Explain the sun",
    "Is moon also a star?",
    "What is the rotation of Venus?",
  ];
  for (let query of queries) {
    console.log(`\n==== QUERY: "${query}"`);
    const result = await searchArticles(collectionName, query, 3);
    console.log(JSON.stringify(result, null, 2));
  }
})();
