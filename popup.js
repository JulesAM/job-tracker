// Adding Analytics Code

var _gaq = _gaq || [];
_gaq.push(['_setAccount', AnalyticsCode]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();

document.addEventListener('DOMContentLoaded', function () { // this function  starts when extension is clicked

    // setting global variables
    Trello.setKey(APP_KEY);
    var token = localStorage.getItem('trello_token');
    var board_id = localStorage.getItem('board_id');
    var create_board = document.getElementById("create_board");
    var board_missing_div = document.getElementById('board_missing');
    var oauth_ok_div = document.getElementById('oauth_ok');
    var checkPageButton = document.getElementById('checkPage');
    var today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // if token doesn't exist, go to options page and make the user authorize it
    if (!token) {
        chrome.tabs.create({ url: chrome.extension.getURL('settings/index.html') });
        sendResponse();
        return true;
    }
    // if board does not exist, create one and add it to local storage
    else if (!board_id) {
        board_create_function();
    }
    else {
        working();
    }

    function board_create_function() {
        board_missing_div.style.display = 'block';
        oauth_ok_div.style.display = 'none';

        create_board.addEventListener('click', function () {

            document.getElementById("create_board").innerHTML = "creating...";

            // create a new board and add lists to it
            Trello.post(`/boards?token=${token}&name=Full time Hunt`)
                .then(async (response) => {
                    localStorage.setItem('board_id', response.id);
                    board_id = localStorage.getItem('board_id');
                    Trello.post(`/lists?token=${token}&name=Offer&idBoard=${board_id}`);
                    await Trello.post(`/lists?token=${token}&name=Reject&idBoard=${board_id}`);
                    await Trello.post(`/lists?token=${token}&name=InProgress&idBoard=${board_id}`);
                    await Trello.post(`/lists?token=${token}&name=Applied&idBoard=${board_id}`);
                    await Trello.post(`/lists?token=${token}&name=Wishlist&idBoard=${board_id}`);
                    document.getElementById("create_board").innerHTML = "Done!";
                    working();
                })
                .catch(error => console.log(error));
        });
    }

    function working() {
        // initializing it again IN CASE this is first time of use
        board_id = localStorage.getItem('board_id');

        oauth_ok_div.style.display = 'block';
        board_missing_div.style.display = 'none';

        let dropdown = document.getElementById('list_options');
        dropdown.length = 0;
        let defaultOption = document.createElement('option');
        defaultOption.text = 'Choose list';
        dropdown.add(defaultOption);
        dropdown.selectedIndex = 0;

        // fetches all the lists from the board whose id is ${board_id}
        // this is to be populated in the drop down of the extension
        Trello.get(`/boards/${board_id}/lists?token=${token}`)
            .then(data => {
                let option;

                for (let i = 0; i < data.length; i++) {
                    option = document.createElement('option');
                    option.text = data[i].name;
                    option.value = data[i].id;
                    dropdown.add(option);
                }
            })
            .catch(err => {
                console.log("user has deleted the board manually.");
                board_create_function();
            });

        chrome.tabs.getSelected(null, function (tab) {
            document.getElementById('data_url').value = tab.url;
        });

        // On button click, POST all the field data in trello board
        checkPageButton.addEventListener('click', function () {

            // Button Click Event
            _gaq.push(['_trackEvent', 'Add To Trello', 'clicked']);

            chrome.tabs.getSelected(null, function (tab) {

                // Here's we'll make the card contents to POST
                let data_url = document.getElementById('data_url').value;
                let data_company = document.getElementById('data_company').value;
                let data_position = document.getElementById('data_position').value;
                let data_location = document.getElementById('data_location').value;
                let data_notes = document.getElementById('data_notes').value;
                idList = document.getElementById('list_options').value;
                let date_applied = today.getDate() + " " + monthNames[today.getMonth()] + ", " + today.getFullYear();

                let description = encodeURIComponent(`URL: ${data_url} \n Company: ${data_company} \n Position: ${data_position} \n Location: ${data_location} \n Date Applied: ${date_applied} \n\n Notes: ${data_notes}`);

                Trello.post(`/cards?key=${APP_KEY}&token=${token}&idList=${idList}&name=${data_company}&desc=${description}`)
                    .then(response => {
                        console.log("result", response);
                        if (response.status == 400 || response.status == 401) {
                            console.log("error error");
                            // now change divs
                            let abc = document.getElementById('post_fail');
                            abc.style.display = 'block';
                        } else {
                            console.log("POSTED");
                            // now change divs
                            let abc = document.getElementById('post_success');
                            oauth_ok_div.style.display = 'none';
                            abc.style.display = 'block';
                        }
                    })
                    .catch(err => console.error(err));
            });
        }, false);
    }

}, false);
