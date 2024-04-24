const visitor = require("../model/visitor");

module.exports.addVisitor = async (req, res) => {
    console.log("adding visitor");
    console.log(req.headers.authData);

    try {
        const { firstname, lastname, phone, documentType, companion } =
            req.body;

        const visitorFound = await visitor.findOne({ phone: phone });

        if (visitorFound) {
            console.log("visitor found");
            return res.json({
                visitor: visitorFound,
            });
        }

        if (req.file) {
            console.log("File uploaded to:", req.file.path);
            const visitorToBeAdded = new visitor({
                firstname,
                lastname,
                phone,
                documentType,
                document: req.file.path,
                companion,
                enteredBy: req.headers.authData.id,
            });

            console.log(visitorToBeAdded);

            await visitorToBeAdded.save();
            console.log("visitor added");
            res.status(201).json({ success: true, message: "visitor added" });
        } else {
            console.log("error uploading file");
            res.status(400).send("Error uploading file");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getVisitors = async (req, res) => {
    console.log("getting all visitors");
    try {
        const allVisitors = await visitor.find({});

        res.json({
            success: true,
            visitors: [...allVisitors],
        });
    } catch (err) {
        res.json({
            success: false,
            message: "something went wrong",
        });
    }
};
