import express from "express";
import { keys } from "../app.js";
import { randomString } from "timonjs";
import { getFile, decryptBase64, importJWK, encryptBase64 } from "../components/functions.js";
import { saveChat, saveFile } from "../database/database.js";

const router = express.Router();

// This router serves under /upload
router.post("/", async (req, res) => {
    try {

        if (!req.session?.user?.valid) return res.status(401).json({ message: "Du bist nicht angemeldet.", valid: false });
        if (req.session.user.email !== req.body.from) return res.status(401).json({ message: "Du kannst keine Dateien für andere Personen hochladen.", valid: false });

        const { from, to, type, name, data } = req.body;
        const base64 = await decryptBase64(data.data, data.key, data.iv, await importJWK(keys.privateKey, true));
        const filename = randomString(64);
        let url = `${req.protocol}://${req.get("host")}/upload/${filename}`;
        if (type === "3d") url = url.replace("upload", "models");
        const index = await saveFile(from, to, filename, base64);
        const result = await saveChat(from, to, { type, name, url });

        if (result && index) {
            res.json({ message: "Datei erfolgreich hochgeladen.", valid: true, url });
        } else {
            res.status(500).json({ message: "Etwas hat nicht geklappt. Versuche es in ein paar Sekunden erneut.", valid: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Etwas hat nicht geklappt. Versuche es in ein paar Sekunden erneut.", valid: false });
    }
});

router.get("/:name", async (req, res) => {

    if (!req.session?.user?.valid) return res.status(302).redirect("/");

    const response = await getFile(req.session.user.email, req.params.name);

    const encrypted = await encryptBase64(response.base64, await importJWK(req.session.user.publicKey));

    response.base64 = encrypted;

    if (response) return res.json({ response });
    
    res.status(400).end();
});

export default router;