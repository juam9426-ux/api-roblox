export default async function handler(request) {

    const headers = {
        "Content-Type":
            "application/json; charset=utf-8",

        "Cache-Control":
            "no-store",

        "Access-Control-Allow-Origin":
            "*",

        "Access-Control-Allow-Methods":
            "GET, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type, Accept"
    };


    if(request.method === "OPTIONS") {

        return new Response(
            null,
            {
                status: 204,
                headers
            }
        );
    }


    if(request.method !== "GET") {

        return Response.json(
            {
                error:
                    "Solo se permite GET."
            },
            {
                status: 405,
                headers
            }
        );
    }


    const url =
        new URL(request.url);


    const username =
        (
            url.searchParams
                .get("username") || ""
        ).trim();


    if(!username) {

        return Response.json(
            {
                error:
                    "Falta el parámetro username."
            },
            {
                status: 400,
                headers
            }
        );
    }


    if(username.length > 20) {

        return Response.json(
            {
                error:
                    "El username no puede superar 20 caracteres."
            },
            {
                status: 400,
                headers
            }
        );
    }


    try {

        /*
        ==========================================
        1. BUSCAR USERNAME
        ==========================================
        */

        const usernameResponse =
            await fetch(
                "https://users.roblox.com/v1/usernames/users",
                {
                    method: "POST",

                    headers: {
                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            usernames:
                                [username],

                            excludeBannedUsers:
                                false
                        })
                }
            );


        if(!usernameResponse.ok) {

            const errorText =
                await usernameResponse.text();

            return Response.json(
                {
                    error:
                        "Roblox rechazó la búsqueda.",

                    status:
                        usernameResponse.status,

                    details:
                        errorText.slice(
                            0,
                            500
                        )
                },
                {
                    status: 502,
                    headers
                }
            );
        }


        const usernameData =
            await usernameResponse.json();


        const user =
            usernameData
                ?.data?.[0];


        if(!user) {

            return Response.json(
                {
                    user: null,
                    presence: null,
                    avatar: null
                },
                {
                    status: 200,
                    headers
                }
            );
        }


        const userId =
            user.id;


        /*
        ==========================================
        2. INFORMACIÓN COMPLETA DEL USUARIO
        ==========================================
        */

        let profile = null;


        try {

            const profileResponse =
                await fetch(
                    "https://users.roblox.com/v1/users/" +
                    encodeURIComponent(userId)
                );


            if(profileResponse.ok) {

                profile =
                    await profileResponse.json();

            }

        }
        catch(error) {

            profile = null;

        }


        /*
        ==========================================
        3. PRESENCE
        ==========================================
        */

        let presence = null;


        try {

            const presenceResponse =
                await fetch(
                    "https://presence.roblox.com/v1/presence/users",
                    {
                        method: "POST",

                        headers: {
                            "Accept":
                                "application/json",

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                userIds:
                                    [userId]
                            })
                    }
                );


            if(presenceResponse.ok) {

                const presenceData =
                    await presenceResponse.json();


                presence =
                    presenceData
                        ?.userPresences?.[0]
                    || null;

            }

        }
        catch(error) {

            presence = null;

        }


        /*
        ==========================================
        4. AVATAR
        ==========================================
        */

        let avatar = null;


        try {

            const avatarResponse =
                await fetch(

                    "https://thumbnails.roblox.com/v1/users/avatar-headshot" +

                    "?userIds=" +
                    encodeURIComponent(userId) +

                    "&size=150x150" +

                    "&format=Png" +

                    "&isCircular=false",

                    {
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if(avatarResponse.ok) {

                const avatarData =
                    await avatarResponse.json();


                avatar =
                    avatarData
                        ?.data?.[0]
                    || null;

            }

        }
        catch(error) {

            avatar = null;

        }


        /*
        ==========================================
        5. RESPUESTA FINAL
        ==========================================
        */

        return Response.json(

            {
                user: {

                    id:
                        profile?.id ??
                        user.id,

                    name:
                        profile?.name ??
                        user.name,

                    displayName:
                        profile?.displayName ??
                        user.displayName,

                    requestedUsername:
                        user.requestedUsername,

                    hasVerifiedBadge:
                        Boolean(
                            profile?.hasVerifiedBadge ??
                            user.hasVerifiedBadge
                        ),

                    description:
                        profile?.description ??
                        "",

                    created:
                        profile?.created ??
                        null,

                    isBanned:
                        Boolean(
                            profile?.isBanned
                        )
                },


                presence: presence
                    ? {

                        userPresenceType:
                            presence.userPresenceType,

                        lastLocation:
                            presence.lastLocation ||
                            null,

                        placeId:
                            presence.placeId ||
                            null,

                        rootPlaceId:
                            presence.rootPlaceId ||
                            null,

                        gameId:
                            presence.gameId ||
                            null

                    }
                    : null,


                avatar: avatar
                    ? {

                        imageUrl:
                            avatar.imageUrl ||
                            null,

                        state:
                            avatar.state ||
                            null

                    }
                    : null

            },

            {
                status: 200,
                headers
            }
        );


    }
    catch(error) {

        return Response.json(

            {
                error:
                    "Error conectando con Roblox.",

                details:
                    error?.message ||
                    "Unknown error"
            },

            {
                status: 502,
                headers
            }
        );

    }
}
