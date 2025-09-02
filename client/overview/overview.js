document.addEventListener("DOMContentLoaded", async() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
        window.location.href = "/sign-in.html";
    }
    const overview = document.getElementById("overview");
    if (window.location.href.includes("/overview")) {
        overview.classList.add("HeaderBottomLine");
    }
    
    const token = localStorage.getItem("token");
    const apiKey = 'a03a902602da3d800fc6a8a7c4b74f25';

    const cityNameInput = document.getElementById("cityName");
    const applyCityBtn = document.getElementById("applyCity");
    const outputText = document.querySelector(".outputText");

    let isEditing = false;

    applyCityBtn.addEventListener("click", async() => {
        const inputText = cityNameInput.value.trim();

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${inputText}&appid=${apiKey}&units=metric`;

        if(!inputText){
            alert("Введите название города!");
            return;
        }

        fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

            outputText.innerHTML = `
            <h3>${data.name}</h3>
            <p>Temperature: ${Math.round(data.main.temp)}°C</p>
            <p>Weather: ${data.weather[0].description}</p>
            <p>Humidity: ${data.main.humidity}</p>
            <p>Wind: ${data.wind.speed} m\s</p>
            <img src="${iconUrl}">
            <p>Max. daily temp.: ${Math.round(data.main.temp_max)}°C</p>
            <p>Min. daily temp.: ${Math.round(data.main.temp_min)}°C</p>
            `
        })

    })

    //Основной трай блок при отрисовке
    try{
        const outputEmail = document.querySelector(".userEmail");
        const responseInfo = await fetch(`http://localhost:3000/notes/userinfo`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        //разлогин
        if (responseInfo.status === 401 || responseInfo.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("isLoggedIn");
            window.location.href = "/sign-in.html";
            return;
        }
        const dataOut = await responseInfo.json();
        outputEmail.textContent = ("Email:" + " " + dataOut.email);

        const responseNotes = await fetch("http://localhost:3000/usernotes", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const dataNotes = await responseNotes.json();


        const addNoteButton = document.getElementById("addNoteOverview");
        addNoteButton.addEventListener("click", async() => {
            const status = 'not_started';
            const noteWrapper = document.createElement('div');
            noteWrapper.className = 'noteWrapper';

            const inputsContainer = document.createElement('div');
            inputsContainer.id = 'inputsContainer';

            const textTitle = document.createElement('input');
            textTitle.type = 'text';
            textTitle.placeholder = 'Введите заголовок...';
            textTitle.id = 'new_note_inputTitle';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Введите заметку...';
            input.id = 'new_note_input';

            const saveBtn = document.createElement('button');
            saveBtn.id = 'saveBtn_inProgress';
            saveBtn.textContent = 'Save';

            document.body.appendChild(noteWrapper);
            inputsContainer.appendChild(textTitle);
            inputsContainer.appendChild(input);

            noteWrapper.appendChild(inputsContainer);
            noteWrapper.appendChild(saveBtn);

            textTitle.focus();

            saveBtn.addEventListener("click", async() =>{
                const newTitle = textTitle.value.trim();
                const newContent = input.value.trim();

                    const response = await fetch(`http://localhost:3000/newnote`, {
                        method: "POST", 
                        headers: {
                            "Content-Type": "application/json",
                            Authorization : `Bearer ${token}`
                        }, 
                        body: JSON.stringify({title: newTitle, content: newContent, status: status})
                    })
                    if (response.ok) {
                        const data = await response.json();

                        const createdNote = data.note || data.noteItem || data;
                        noteWrapper.remove();
                        const noteCard = CreateNoteOverviewCard(createdNote);
                        document.querySelector(".overview_container").appendChild(noteCard);
                    }
            });
        })

        const overviewContainer = document.querySelector(".overview_container");

        if (dataNotes.notes && Array.isArray(dataNotes.notes)) {
        dataNotes.notes.forEach(note => {
            const noteOverviewContainer = CreateNoteOverviewCard(note);

            overviewContainer.appendChild(noteOverviewContainer);
            LetNoteEdit(noteOverviewContainer, note)
        });
    }
    } catch (err) {
        console.error(err)
    }

    const progressTracker = document.getElementById("progressTracker");
    progressTracker.addEventListener("click", () => {
        window.location.href = '/notes'
    })

    //Кнопка показа панельки слева
    const burgerBtn = document.getElementById("burger-btn");
    const leftPanel = document.querySelector('.left_panel');

    burgerBtn.addEventListener('click', () => {
        leftPanel.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!leftPanel.contains(e.target) && !burgerBtn.contains(e.target)) {
            leftPanel.classList.remove('show');
        }
    });

    const darkText = document.querySelector(".darktheme");
    const weatherText = document.querySelector(".weather");
    const dropDownItem = document.querySelector(".dropdown-toggle");

    darkText.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        darkText.classList.toggle("darkText");
        weatherText.classList.toggle("darkText");
        burgerBtn.classList.toggle("dark_burger")

        darkText.classList.toggle("darkBlockThemeHeader");
        weatherText.classList.toggle("darkBlockThemeHeader");

        dropDownItem.classList.toggle("dropdown-toggleDarkTheme");

        if (document.body.classList.contains("dark")){
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }
    });

    document.getElementById("logout").addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/sign-in.html";
    });

    document.getElementById("profile").addEventListener("click", function () {
        const profileHeader = document.querySelector(".profile_header");

        profileHeader.style.display = 'block';

        function handleOutsideClick(event) {
            if (!profileHeader.contains(event.target) && event.target.id !== "profile") {
                profileHeader.style.display = 'none';
                document.removeEventListener('click', handleOutsideClick);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);
    });

    document.querySelector(".weather").addEventListener("click", function () {
        const bottomContainer = document.querySelector(".bottomContainer");

        bottomContainer.style.display = 'block';

        function handleOutsideClick(event) {
            if (!bottomContainer.contains(event.target) && !event.target.classList.contains("weather")) {
                bottomContainer.style.display = 'none';
                document.removeEventListener('click', handleOutsideClick);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);
    });

    function makeNoteDraggable(noteElement, noteId){
        let offsetX = 0, offsetY = 0;
        let isDragging = false;

        const savedPosition = JSON.parse(localStorage.getItem(`note-pos-${noteId}`));
        if (savedPosition) {
            noteElement.style.position = "absolute";
            noteElement.style.left = savedPosition.x + "px";
            noteElement.style.top = savedPosition.y + "px";
        }

        noteElement.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - noteElement.offsetLeft;
            offsetY = e.clientY - noteElement.offsetTop;
            noteElement.style.position = "absolute";
            noteElement.style.zIndex = 2;
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging || isEditing) return;
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            const container = document.querySelector(".overview_container");
            const rect = container.getBoundingClientRect();

            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX + noteElement.offsetWidth > rect.width) newX = rect.width - noteElement.offsetWidth;
            if (newY + noteElement.offsetHeight > rect.height) newY = rect.height - noteElement.offsetHeight;

            noteElement.style.left = newX + "px";
            noteElement.style.top = newY + "px";
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                localStorage.setItem(`note-pos-${noteId}`, JSON.stringify({
                    x: noteElement.offsetLeft,
                    y: noteElement.offsetTop
                }));
            }
        });
    }

    function LetNoteEdit (noteOverviewContainer, note) {
        noteOverviewContainer.addEventListener("dblclick", () => {
                isEditing = true;
                noteOverviewContainer.innerHTML = "";

                const inputEditTitle = document.createElement("input");
                inputEditTitle.id = "new_note_inputTitle";
                inputEditTitle.value = note.title;

                const inputEditContent = document.createElement("textarea");
                inputEditContent.id = "new_note_input"
                inputEditContent.value = note.content;

                const btnSaveEdit = document.createElement("button");
                btnSaveEdit.id = "saveBtn_inProgress";
                btnSaveEdit.textContent = "Save";

                btnSaveEdit.addEventListener("click", async() =>{
                    isEditing = false;
                    const newTitle = inputEditTitle.value.trim();
                    const newContent = inputEditContent.value.trim();

                    const response = await fetch(`http://localhost:3000/notes/update/${note.id}`, {
                        method: "POST", 
                        headers: {
                            "Content-Type": "application/json",
                            Authorization : `Bearer ${token}`
                        }, 
                        body: JSON.stringify({title: newTitle, content: newContent})
                    })
                    if (response.ok) {
                        note.title = newTitle;
                        note.content = newContent;

                        noteOverviewContainer.innerHTML = "";
                        const titleEl = document.createElement("h3");
                        titleEl.textContent = note.title;
                        const contentEl = document.createElement("p");
                        contentEl.classList.add("contentElementOverview");
                        contentEl.textContent = note.content;
                        const btnDelete = document.createElement("button");
                        btnDelete.id = 'btnDelete';
                        btnDelete.textContent = 'x';

                        btnDelete.addEventListener("click", async () => {
                            try {
                                const res = await fetch(`http://localhost:3000/notes/delete/${note.id}`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({})
                                });
                                if (res.ok) noteOverviewContainer.remove();
                            } catch (err) { console.error(err); }
                        });

                        noteOverviewContainer.appendChild(titleEl);
                        noteOverviewContainer.appendChild(btnDelete);
                        noteOverviewContainer.appendChild(contentEl);
                    }

                });

                async function handleOutsideClick(event) {
                            if (!noteOverviewContainer.contains(event.target)) {

                                const newTitle = inputEditTitle.value.trim();
                                const newContent = inputEditContent.value.trim();

                                if (!newTitle && !newContent) {
                                    noteOverviewContainer.remove();
                                    try {
                                        const res = await fetch(`http://localhost:3000/notes/delete/${note.id}`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`
                                            },
                                            body: JSON.stringify({})
                                        });
                                        if (res.ok) noteOverviewContainer.remove();
                                        } catch (err) { console.error(err); 
                                            
                                        }
                                    document.removeEventListener('click', handleOutsideClick);
                                    return;
                                }

                                fetch(`http://localhost:3000/notes/update/${note.id}`, {
                                    method: "POST", 
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization : `Bearer ${token}`
                                    }, 
                                    body: JSON.stringify({title: newTitle, content: newContent})
                                })
                                .then(data => {
                                    note.title = newTitle;
                                    note.content = newContent;
                                    isEditing = false;

                                    noteOverviewContainer.innerHTML = "";
                                    const titleEl = document.createElement("h3");
                                    titleEl.textContent = note.title;
                                    const contentEl = document.createElement("p");
                                    contentEl.classList.add("contentElementOverview");
                                    contentEl.textContent = note.content;
                                    const btnDelete = document.createElement("button");
                                    btnDelete.id = 'btnDelete';
                                    btnDelete.textContent = 'x';

                                    noteOverviewContainer.appendChild(titleEl);
                                    noteOverviewContainer.appendChild(contentEl);
                                    noteOverviewContainer.appendChild(btnDelete);


                                    btnDelete.addEventListener("click", async () => {
                                        try {
                                            const res = await fetch(`http://localhost:3000/notes/delete/${note.id}`, {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`
                                                },
                                                body: JSON.stringify({})
                                            });
                                            if (res.ok) noteOverviewContainer.remove();
                                        } catch (err) { console.error(err); }
                                    });
                                })
                                .catch((err) => {
                                    console.error(err);
                                    alert("❌ Не удалось сохранить заметку");
                                })
                                .finally(() => {
                                    document.removeEventListener('click', handleOutsideClick);
                                });
                            }
                }

                    setTimeout(() => {
                        document.addEventListener("click", handleOutsideClick);
                    }, 10);

                noteOverviewContainer.appendChild(inputEditTitle);
                noteOverviewContainer.appendChild(inputEditContent);
                noteOverviewContainer.appendChild(btnSaveEdit);

            })
    }

    function CreateNoteOverviewCard(note){
        const noteOverviewContainer = document.createElement("div");
        noteOverviewContainer.classList.add("noteOverviewContainer");
        noteOverviewContainer.dataset.id = note.id;
            
        const titleEl = document.createElement("h3");
        titleEl.textContent = note.title;
        const contentEl = document.createElement("p");
        contentEl.classList.add("contentElementOverview");
        contentEl.textContent = note.content;
        const btnDelete = document.createElement("button");
        btnDelete.id = 'btnDelete';
        btnDelete.textContent = 'x';

        const btnOpenItemWindow = document.createElement("button");
        btnOpenItemWindow.id = 'btnOpenItemWindow';
        btnOpenItemWindow.textContent = 'Show items';

            btnDelete.addEventListener("click", async() => {
                try {
                    const response = await fetch(`http://localhost:3000/notes/delete/${note.id}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ })
                    })

                    if (response.ok) {
                        noteOverviewContainer.remove();
                    } else {
                        console.error('Ошибка при удалении');
                    }
                } catch (err) {
                    console.error(err);
                }
            })

            btnOpenItemWindow.addEventListener("click", async() => {
                openItemsWindow(note.id);
            })
            
        noteOverviewContainer.appendChild(titleEl);
        noteOverviewContainer.appendChild(btnDelete);
        noteOverviewContainer.appendChild(btnOpenItemWindow);
        noteOverviewContainer.appendChild(contentEl);

        makeNoteDraggable(noteOverviewContainer, note.id);

        LetNoteEdit(noteOverviewContainer, note);

        return noteOverviewContainer;
    }

    async function openItemsWindow(note_id){
        const openedNote = document.createElement('div');
            openedNote.classList.add('opened_note');
            openedNote.dataset.id = note_id;
            
            const blurOverlay = document.createElement('div');
            blurOverlay.classList.add('blur-overlay');

            const allContainerItems = document.createElement("div");
            allContainerItems.classList.add("allContainerItems");

            const todo = document.createElement("h2");
            todo.classList.add("ToDoList");
            todo.textContent = 'To Do List';

            const itemsContainer = document.createElement("div");
            itemsContainer.classList.add("itemsContainer");

            const addNotesItemBtn = document.createElement("button");
            addNotesItemBtn.classList.add("addNotesItemBtn");
            addNotesItemBtn.textContent = '+ item';

            document.body.appendChild(blurOverlay);
            document.body.appendChild(openedNote);
            allContainerItems.appendChild(todo);
            allContainerItems.appendChild(itemsContainer);
            allContainerItems.appendChild(addNotesItemBtn);

            openedNote.appendChild(allContainerItems);
            
            if(openedNote){
                const noteId = openedNote.dataset.id;
                if (!noteId) {
                    console.error("❌ noteId is undefined!");
                    return;
                }
                const responseItems = await fetch(`http://localhost:3000/usernoteitems?note_id=${noteId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (responseItems.status === 401 || responseItems.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("isLoggedIn");
                    window.location.href = "/sign-in.html";
                    return;
                }

                const dataNoteItems = await responseItems.json();

                dataNoteItems.noteItems.forEach(noteItem => {
                    const itemBlock = createModalNoteItem(noteItem);
                    itemsContainer.appendChild(itemBlock);
                });
            }

            addNotesItemBtn.addEventListener("click", () => {
                const itemBlock = document.createElement("div");
                itemBlock.classList.add("itemBlock");
                itemBlock.dataset.id = noteItem.dataset.id;

                const textItem = document.createElement("input");
                textItem.type = "text";
                textItem.placeholder = "Введите заметку...";
                textItem.id = "textItem";

                itemBlock.appendChild(textItem);
                itemsContainer.appendChild(itemBlock);

                textItem.focus();

                function handleOutsideClick(event) {
                    if (!itemBlock.contains(event.target)) {

                        const content = textItem.value.trim();
                        if (!content) {
                            itemBlock.remove();
                            document.removeEventListener('click', handleOutsideClick);
                            return;
                        }

                        fetch("http://localhost:3000/newitems", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                note_id: openedNote.dataset.id,
                                content: content,
                                is_done: false
                            })
                        })
                        .then(async (response) => {
                            if (response.status === 401 || response.status === 403) {
                                localStorage.removeItem("token");
                                localStorage.removeItem("isLoggedIn");
                                window.location.href = "/sign-in.html";
                                return;
                            }

                            if (!response.ok) throw new Error("Ошибка сервера");

                            const data = await response.json();
                            console.log("✅ Добавлено:", data);

                            itemBlock.remove(); 

                            const newCard = createModalNoteItem(data.noteItem); 
                            itemsContainer.appendChild(newCard);
                        })
                        .catch((err) => {
                            console.error(err);
                            alert("❌ Не удалось сохранить заметку");
                        })
                        .finally(() => {
                            document.removeEventListener('click', handleOutsideClick);
                        });
                    }
                }

                setTimeout(() => {
                    document.addEventListener('click', handleOutsideClick);
                }, 0);
            });
    
            function closeModal() {
                openedNote.remove();
                blurOverlay.remove();
            }

            blurOverlay.addEventListener("click", closeModal);
    }

    function createModalNoteItem(noteItem) {
        const containerBlockItems = document.createElement("div");
        containerBlockItems.classList.add("containerBlockItems")

        const itemBlock = document.createElement("div");
        itemBlock.classList.add("itemBlock");
        itemBlock.dataset.id = noteItem.item_id;

        const checkItem = document.createElement("input");
        checkItem.type = "checkbox";
        checkItem.classList.add("checkItem");
        checkItem.checked = noteItem.is_done;

        checkItem.dataset.itemId = noteItem.item_id

        checkItem.addEventListener("click", async(event) => {
            const itemId = event.target.dataset.itemId;
            const newStatus = event.target.checked;

            try {
                const response = await fetch(`http://localhost:3000/noteitems/${itemId}/status`, {
                method:"PUT", 
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({is_done: newStatus})
            })
            } catch(err){
                console.error(err);
            }
        })

        const textItem = document.createElement("span");
        textItem.classList.add("textItem");
        textItem.textContent = noteItem.content;

        const btnDeleteItem = document.createElement("button");
        btnDeleteItem.id = 'btnDeleteItem';
        btnDeleteItem.textContent = '🗑';

        btnDeleteItem.addEventListener("click", async () => {
            try {
                const response = await fetch(`http://localhost:3000/notesitem/delete/${noteItem.item_id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({})
                });
                containerBlockItems.remove();
            } catch (err) {
                console.error(err);
            }
        });

        itemBlock.appendChild(checkItem);
        itemBlock.appendChild(textItem);
        itemBlock.appendChild(btnDeleteItem);

        containerBlockItems.appendChild(itemBlock);

        // makeNoteItemsDraggable(containerBlockItems);

        return containerBlockItems;
    }

})

window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    const darkText = document.querySelector(".darktheme");
    const weatherText = document.querySelector(".weather");
    const dropDownItem = document.querySelector(".dropdown-toggle");
    const profileHeader = document.querySelector(".profile_header");
    const burgerBtn = document.getElementById("burger-btn");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        darkText.classList.add("darkText");
        weatherText.classList.add("darkText");
        burgerBtn.classList.add("dark_burger");
        profileHeader.classList.add("profile_header_Dark");

        darkText.classList.add("darkBlockThemeHeader");
        weatherText.classList.add("darkBlockThemeHeader");
        dropDownItem.classList.add("dropdown-toggleDarkTheme");
    }
});
