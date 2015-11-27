"tac /var/log/flu-daemon.log | grep -m1 -oP '(Node ID:).*'" | awk '{print $3}'
