document.addEventListener("DOMContentLoaded", () => {
    const signinEmail = document.querySelector("#signin_input_email");
    const signupEmail = document.querySelector("#signup_input_email");

    const signinPassword = document.querySelector("#signin_input_password");
    const signupPassword = document.querySelector("#signup_input_password");

    const verificationCode = document.querySelector("#verificationCode");

    const emailConfirm = document.querySelector("#email_confirm");
    const signinSuccess = document.querySelector("#signin_success");
    const signupSuccess = document.querySelector("#signup_success");

    const formSignIn = document.querySelector(".form-signin");
    const formSignUp = document.querySelector(".form-signup");

    const linkSignIn = document.querySelector("#linkSignIn");
    const linkSignUp = document.querySelector("#linkSignUp");

    const sendMailConfirmationButton = document.querySelector("#sendMailConfirmation");
    const verificationBlock  = document.querySelector("#verificationBlock");

    linkSignIn.addEventListener("click", () => {
        formSignIn.hidden = false;
        formSignUp.hidden = true;
    })

    linkSignUp.addEventListener("click", () => {
        formSignIn.hidden = true;
        formSignUp.hidden = false;
    })

    const EMAIL_REGEXP = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
        window.location.href = "/notes_page/notes.html";
    }

    function isEmailValid(value) {
        return EMAIL_REGEXP.test(value);
    }
    
    // ======== Регистрация =========
    if (signupSuccess) {
        signupSuccess.addEventListener("click", async () => {
            const email = signupEmail.value.trim();
            const password = signupPassword.value.trim();

            const emailUpError = document.querySelector("#signup_emailError");
            const passwordUpError = document.querySelector("#signup_passwordError")
            if (emailUpError) emailUpError.textContent = "";
            if (passwordUpError) passwordUpError.textContent = "";

            if (!email && !password){
                if (emailUpError) emailUpError.textContent = "Введите почту ❗";
                if (passwordUpError) passwordUpError.textContent = "Введите пароль ❗";
                return
            } else if (!email) {
                if (emailUpError) emailUpError.textContent = "Введите почту ❗";
                return;
            } else if (!password) {
                if (passwordUpError) passwordUpError.textContent = "Введите пароль ❗";
                return;
            }

            if(!isEmailValid(email)){
                if (emailUpError) emailUpError.textContent = "Введите почту корректно ❗";
                return;
            }

            const checkResponse = await fetch("http://localhost:3000/checkEmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usermail: email })
            });

            const checkData = await checkResponse.json();
            if (emailUpError) emailUpError.textContent = "";

            if (!checkResponse.ok) {
                if (emailUpError) {
                    emailUpError.textContent = checkData.message || "Пользователь с такой почтой уже существует";
                }
                return;
            }

            if (verificationBlock) {
                verificationBlock.hidden = false;
            }
            sendMailConfirmationButton.hidden = false;
            emailConfirm.hidden = false;
            signupSuccess.hidden = true;

            sendMailConfirmationButton.addEventListener("click", async () => {
                const response = await fetch("http://localhost:3000/sendMail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usermail: email })
                });
                const data = await response.json();
                console.log("📨 Письмо отправлено:", data);
            });
        });
    }

    if(emailConfirm){
        emailConfirm.addEventListener("click", async(req, res) => {
            const email = signupEmail.value.trim();
            const password = signupPassword.value.trim();
            const code = verificationCode.value.trim();

            if (!code || code.length !== 6) {
                alert("Введите 6-значный код");
                return;
            }

            const verifyRes = await fetch("http://localhost:3000/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, code })
            });

            const data = await verifyRes.json();

            if (verifyRes.ok) {

            try {
                const registrationRes = await fetch("http://localhost:3000/registration", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await registrationRes.json();

                const emailError = document.querySelector("#emailError");
                if (emailError) emailError.textContent = "";

                if (!registrationRes.ok) {
                    if(emailError) {
                        emailError.textContent = data.message || "Пользователь с такой почтой уже существует";
                        }
                    return;
                }
                    
                signupEmail.value = "";
                signupPassword.value = "";
                    
                const bodyText = document.querySelector(".bodyText");
                bodyText.innerHTML = `<h1 class="h3 mb-3 font-weight-normal">Registration success</h1>`

                console.log("✅ Ответ сервера:", data);

            } catch (error) {
                console.error("❌ Ошибка запроса:", error);
            }

            console.log("✅ Код подтверждён, регистрация завершена");

            // Можно показать сообщение
            const bodyText = document.querySelector(".bodyText");
            bodyText.innerHTML = `<h1 class="h3 mb-3 font-weight-normal">Регистрация завершена</h1>`;
            } else {
                alert(data.message || "❌ Неверный код");
            }

        })
    }

    // ========= Авторизация ============
    if (signinSuccess) {
        signinSuccess.addEventListener("click", async (e) => {
            e.preventDefault();

            const email = signinEmail.value.trim();
            const password = signinPassword.value.trim();
            const emailInError = document.querySelector("#signin_emailError");
            const passwordInError = document.querySelector("#signin_passwordError")

            if (emailInError) emailInError.textContent = "";
            if (passwordInError) passwordInError.textContent = "";

            if (!email && !password){
                if (emailInError) emailInError.textContent = "Введите почту ❗";
                if (passwordInError) passwordInError.textContent = "Введите пароль ❗";
                return
            } else if (!email) {
                if (emailInError) emailInError.textContent = "Введите почту ❗";
                return;
            } else if (!password) {
                if (passwordInError) passwordInError.textContent = "Введите пароль ❗";
                return;
            }

            if(!isEmailValid(email)){
                if (emailInError) emailInError.textContent = "Введите почту корректно ❗";
                return;
            }

            try {
                const response = await fetch("http://localhost:3000/authorization", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 400) {
                        if (emailInError) emailInError.textContent = data.message || "Неверная почта";
                    } else if (response.status === 401) {
                        if (passwordInError) passwordInError.textContent = data.message || "Неверный пароль";
                    } else {
                        if (emailInError) emailInError.textContent = data.message || "Ошибка входа";
                    }
                    return;
                }

                if (response.ok) {
                    localStorage.setItem("token", data.token); 
                    localStorage.setItem("isLoggedIn", "true");
                    window.location.href = "/notes_page/notes.html";
                }  
            } catch (error) {
                console.error("Ошибка при авторизации:", error);
                if (emailInError) emailInError.textContent = "Ошибка сервера";
            }
        });
    }
})