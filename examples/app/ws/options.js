module.exports = {
    port: 3500,

    rateLimit: {
        rawData: [1, 1000],
        rejectedData: [1, 1000]
    },

    instance: {
        idleTimeout: 8,
        maxBackpressure: 512,
        maxPayloadLength: 512
    }
};
