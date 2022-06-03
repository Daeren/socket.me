module.exports = async function(req, res, next) {
    const ip = Buffer.from(res.getRemoteAddressAsText()).toString();

    //---]>

    let banned = false;

    //---]>

    // ... ip ... "async" work ...

    //---]>

    if(res.aborted) {
        return;
    }

    if(banned) {
        res.close();
    }
    else {
        next();
    }
};
