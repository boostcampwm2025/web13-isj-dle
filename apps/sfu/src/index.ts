import * as mediasoup from "mediasoup";

async function main() {
  const worker = await mediasoup.createWorker();
  console.log("SFU worker started", worker.pid);
}

main();
