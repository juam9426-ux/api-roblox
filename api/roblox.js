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
                    "Método no permitido. Usa GET."
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


    if(
        !username ||
        username.length > 20
    ){

        return Response.json(
            {
                error:
                    "Debes enviar un username válido (máximo 20 caracteres)."
            },
            {
                status: 400,
                headers
            }
        );

    }


    try {

        /*
         * 1. USERNAME → USER ID
         */

        const userRes =
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
                                true
                        })
                }
            );


        if(!userRes.ok){

            const text =
                await userRes.text();


            return Response.json(
                {
                    error:
                        `Roblox usernames API respondió HTTP ${userRes.status}`,

                    details:
                        text.slice(
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


        const userData =
            await userRes.json();


        const user =
            userData?.data?.[0];


        if(!user){

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


        /*
         * 2. PRESENCE
         */

        let presence = null;


        try {

            const presenceRes =
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
                                    [user.id]
                            })
                    }
                );


            if(presenceRes.ok){

                const presenceData =
                    await presenceRes.json();


                presence =
                    presenceData
                        ?.userPresences?.[0]
                    || null;

            }

        }catch{

            presence = null;

        }


        /*
         * 3. AVATAR
         */

        let avatar = null;


        try {

            const avatarRes =
                await fetch(

                    "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
                    "?userIds=" +
                    encodeURIComponent(user.id) +
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


            if(avatarRes.ok){

                const avatarData =
                    await avatarRes.json();


                avatar =
                    avatarData
                        ?.data?.[0]
                    || null;

            }

        }catch{

            avatar = null;

        }


        /*
         * RESPUESTA FINAL
         */

        return Response.json(

            {
                user: {

                    id:
                        user.id,

                    name:
                        user.name,

                    displayName:
                        user.displayName,

                    requestedUsername:
                        user.requestedUsername,

                    hasVerifiedBadge:
                        Boolean(
                            user.hasVerifiedBadge
                        )

                },

                presence,

                avatar

            },

            {
                status: 200,
                headers
            }

        );


    }catch(error){

        return Response.json(

            {
                error:
                    "No se pudo conectar con Roblox.",

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
