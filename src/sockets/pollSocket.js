

export function setupPollSocket(io, prisma) {
  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);

    socket.on("join_poll", (pollId) => {
      console.log(`Socket ${socket.id} joined poll:${pollId}`);
      socket.join(`poll:${pollId}`);
    });
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

    const totalVotes = payload.reduce((sum, o) => sum + o.votes, 0);

    io.to(`poll:${pollId}`).emit("poll_update", {
      pollId: Number(pollId),
      options: payload,
      totalVotes,
    });

    io.to("global").emit("poll_update_global", {
      pollId: Number(pollId),
      options: payload,
      totalVotes,
    });
  }

  return { broadcastPollResults };
}
