const Activity = require("../models/Activity");

// ✅ Enregistrer une activité
exports.trackActivity = async (req, res) => {
    try {
        const { userId, type, action, subject, title, score, meta } = req.body;

        // Validation basique
        if (!userId || !type) {
            return res.status(400).json({ message: "userId et type requis" });
        }

        const activity = await Activity.create({
            userId,
            type,
            action,
            subject,
            title,
            score,
            meta,
        });

        res.status(201).json({ success: true, activity });
    } catch (err) {
        console.error("Erreur trackActivity:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// ✅ Récupérer stats Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const { userId } = req.query; // ou req.user.id si Auth middleware
        if (!userId) {
            return res.status(400).json({ message: "userId requis" });
        }

        // 1. Calcul de la Progression Globale (Niveau & Heures)
        // On compte les leçons terminées (vidéo ou pdf)
        const completedLessons = await Activity.countDocuments({
            userId,
            type: { $in: ["video", "pdf"] },
        });

        // On somme le temps passé (durationSec)
        const timeAgg = await Activity.aggregate([
            { $match: { userId } },
            { $group: { _id: null, totalSec: { $sum: "$durationSec" } } },
        ]);
        const totalSeconds = timeAgg[0]?.totalSec || 0;
        const totalHours = (totalSeconds / 3600).toFixed(1); // 1.5 h

        // Calcul du Niveau (Logique simple: 1 niveau tous les 5 contenus)
        const lessonsPerLevel = 5;
        const currentLevel = Math.floor(completedLessons / lessonsPerLevel) + 1;
        const nextLevelThreshold = currentLevel * lessonsPerLevel;
        const progressToNext = completedLessons % lessonsPerLevel;
        const progressPercent = (progressToNext / lessonsPerLevel) * 100;

        const progress = {
            level: currentLevel,
            totalHours: Number(totalHours),
            completedLessons,
            progressPercent, // 0..100 pour la barre
            nextLevelThreshold
        };

        // 2. Calcul du Streak (Jours consécutifs)
        // On récupère toutes les activités triées par date
        const activities = await Activity.find({ userId }).sort({ createdAt: -1 }).select("createdAt");

        let streak = 0;
        if (activities.length > 0) {
            const today = new Date().setHours(0, 0, 0, 0);
            let lastDate = new Date(activities[0].createdAt).setHours(0, 0, 0, 0);

            // Si la dernière activité est aujourd'hui ou hier, on commence le streak
            if (lastDate === today) {
                streak = 1;
            } else if (lastDate === today - 86400000) {
                streak = 1;
            }

            // On remonte dans le passé
            let currentDate = lastDate;
            for (let i = 1; i < activities.length; i++) {
                const d = new Date(activities[i].createdAt).setHours(0, 0, 0, 0);
                if (d === currentDate) continue; // même jour
                if (d === currentDate - 86400000) {
                    streak++; // jour précédent
                    currentDate = d;
                } else {
                    break; // trou dans le streak
                }
            }
        }

        // 3. Activités récentes (pour notifications / packs)
        const recentActivities = await Activity.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5);

        // 4. Fake recommandation (ou logique plus poussée plus tard)
        // Ici on pourrait chercher la ville préférée de l'user dans ses activités passées
        const lastInPerson = await Activity.findOne({ userId, type: "presentiel" }).sort({ createdAt: -1 });
        const recommendedCenter = lastInPerson
            ? {
                name: lastInPerson.title || "Centre Recommandé",
                city: lastInPerson.city || "Ta ville",
                subject: lastInPerson.subject || "Soutien",
            }
            : null;

        res.json({
            progress,
            streak,
            recentActivities,
            recommendedCenter,
        });
    } catch (err) {
        console.error("Erreur getDashboardStats:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
