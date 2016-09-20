// mixpanel.js
MP.api.setCredentials('c97cbd5d6f444d7ecc12828b7ccd898b');
MP.api.jql(
    function main() {
        return Events({
                from_date: "2016-08-21",
                to_date: "2016-09-20"
            })
            // .filter(function(event) { return event.name == "Video Play" })
            // .filter(function(event) { return event.properties.short_id == "fd7a" })
            .groupBy(
                ["name", "properties.medium"],
                mixpanel.reducer.count()
            )
            .map(function(item) {
                return {
                    "action": item.key[0],
                    // "dmcAdNumber": item.key[1],
                    "medium": item.key[1],
                    "value": item.value
                };
            });
    }
).done(function(results) {
    console.log(results);
    results = _.sortBy(results, 'value').reverse();
    _.each(results, function(result) {
        console.log(result);
        var str = result.action + " | " + result.value + "<br>";
        if (result.action == "Share") {
            str = result.action + ": " + result.medium + " | " + result.value + "<br>";
        }
        $('#output').append(str);
    });
    // $('#chart').MPChart({chartType: 'line', data: results});
});