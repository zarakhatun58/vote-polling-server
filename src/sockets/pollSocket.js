// src/sockets/pollSocket.js
export function setupPollSocket(io, prisma) {
  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);
    socket.on("joinPoll", (pollId) => socket.join(`poll:${pollId}`));
  });

  async function broadcastPollResults(pollId) {
    const options = await prisma.pollOption.findMany({
      where: { pollId: Number(pollId) },
      include: { votes: true },
    });

    const payload = options.map((o) => ({
      id: o.id,
      text: o.text,
      votes: o.votes.length,
    }));

    io.to(`poll:${pollId}`).emit("pollUpdate", {
      pollId: Number(pollId),
      options: payload,
    });
  }

  return { broadcastPollResults };
}
