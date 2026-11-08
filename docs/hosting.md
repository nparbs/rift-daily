# Hosting at lol.parbs.online

A small unprivileged nginx container serves the static files. It runs on the Debian VM next to Scrap Riot and reaches the internet through Scrap Riot's existing Cloudflare Tunnel, the same way as Trailer Park Tamers.

```
player ──https──> Cloudflare ──tunnel──> cloudflared (Scrap Riot's) ──> riftdaily:8080 (this container)
```

Every response is sent with `Cache-Control: no-cache`, so a deploy shows up at once and Cloudflare doesn't keep serving old JS or CSS. Champion portraits load straight from Riot's Data Dragon CDN.

## First-time setup on the VM

1. **Clone the repo.**

   ```sh
   git clone https://github.com/nparbs/rift-daily.git ~/rift-daily
   cd ~/rift-daily
   ```

2. **Check the tunnel network name.** It's normally `scrap-riot_default`. If not, put `TUNNEL_NETWORK=<name>` in a `.env` file.

   ```sh
   sg docker -c "docker network ls" | grep scrap
   ```

3. **Start it.**

   ```sh
   sg docker -c "docker compose up -d --build"
   sg docker -c "docker compose ps"
   ```

4. **Add the hostname in Cloudflare.** In Zero Trust, open Networks, then Tunnels, and edit the tunnel Scrap Riot uses. Under Public Hostnames, add:

   | Field | Value |
   | --- | --- |
   | Subdomain | `lol` |
   | Domain | `parbs.online` |
   | Service | `HTTP`, `riftdaily:8080` |

5. **Check:** `curl https://lol.parbs.online/health` should print `ok`.

## Deploying updates

As with the other games, use a key on the PC that can only run the deploy script:

```sh
cp deploy/deploy-rift-daily.sh ~/deploy-rift-daily.sh && chmod +x ~/deploy-rift-daily.sh
# In ~/.ssh/authorized_keys, one line for the PC's rift-daily-deploy key:
# command="/home/deb/deploy-rift-daily.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... rift-daily-deploy
```

Then from the PC: `ssh -i ~/.ssh/rift-daily-deploy deb@<vm address>`. It fast-forwards to `main` and rebuilds. Nothing is stored on the server, so a rebuild loses nothing.
