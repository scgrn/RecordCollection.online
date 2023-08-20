'use strict';

function search(event) {
    event.preventDefault();
    
    var results = document.getElementById("searchResults");
    results.innerHTML = "Searching...";
    
    var form = document.getElementById("searchForm");
    const formData = new FormData(form);

    var object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });

    var json = JSON.stringify(object);

    fetch('/search', {
        method: "POST",
        redirect: "follow",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: json
    }).then(async (response) => {
        response.clone().json().then((data) => {
            var resultList = "<p>No results found.</p>";
            if (data.length > 0) {
                resultList = "<table class='table table-bordered'>";

                for (let result in data) {
                    console.log(data[result].title + " - " + data[result].inCollection);
                    
                    let row = `<tr>
                        <td><img src="${data[result].thumbnail}" style="width: 75%; height: 75%"/></td>
                        <td>${data[result].title}</td>`;
                            
                    if (data[result].inCollection) {
                        row += `<td>In collection</td>`;
                    } else {
                        row += `<td><a href="./add?id=${data[result].id}&coverImage=${data[result].coverImage}">Add to collection</a></td>`;
                    }
                    row += "</tr>";

                    resultList += row;
                }
            }
            
            results.innerHTML = resultList;
        });
    });

}

function clear(event) {
    event.preventDefault();
    var results = document.getElementById("searchResults");
    results.innerHTML = "";
}
