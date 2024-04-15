console.log('Notification script loaded!');

const offline = new Set();
const observer = new MutationObserver((records) => {
  console.log('new records');
  chrome.runtime.sendMessage({type: 'restart', name: 'lol'});
  for(let i = 0; i < records.length; i++) {
    const record = records[i];
		if(record.type !== 'childList' || record.addedNodes.length == 0) { continue; }
		for(let j = 0; j < record.addedNodes.length; j++) {
			const node = record.addedNodes[j];
			if(node.tagName != 'TR') { continue }
			const name = node.firstChild.innerText;
			const number = name.match(/BattleRoyale #(\d+)/)[1];
			const status = node.querySelector(':nth-child(5)').innerText;
			if(status === '🟢') {
				if(offline.has(number)) {
					offline.delete(number);
					console.log(`${name} is now open!`);
          chrome.runtime.sendMessage({type: 'restart', name});
				}
			} else {
				offline.add(number);
			}
		}
	}
});
observer.observe(document.getElementById("table"), {childList: true, subtree: true});
