/* iOS System Design Roadmap — topic content.
   Add new topics here as numbered keys. Only this file changes between batches. */
window.TOPICS = {

  1: {
    concept:[
      "Client-server architecture is a model where two parties play fixed roles: the <strong>client</strong> asks, the <strong>server</strong> answers. The client initiates a request; the server, which sits waiting and listening, processes it and sends back a response. That request-response exchange is the entire heartbeat of the model.",
      "Three properties define it. First, it is a <strong>role</strong>, not a hardware fact &mdash; the same machine can be a server to one program and a client to another (your API server is a client of the database). Second, it is <strong>many-to-one</strong>: one server serves thousands of clients at once, which is why servers obsess over concurrency and scaling while clients stay simple and independent. Third, the server is the <strong>centralized source of truth</strong> &mdash; it owns the shared data and rules, so every client sees a consistent picture.",
      "You will also hear it in <strong>tiers</strong>. 2-tier is client + server. The common <strong>3-tier</strong> splits into presentation (UI), application (logic) and data (database). A mobile app is 3-tier-plus: your iOS app is presentation, the API servers are application, the database is data &mdash; with object storage and a CDN added. The opposite philosophy is <strong>peer-to-peer</strong>, where all nodes are equal (BitTorrent). Apps choose client-server for control, consistency and security."
    ],
    why:[
      "It solves three problems at once. It <strong>centralizes shared state</strong> so multiple users collaborate on one consistent dataset &mdash; you and a friend see the same WhatsApp thread because one server holds the truth. It <strong>moves trust and heavy work to a controlled place</strong> &mdash; you can never trust a phone, so validation, secrets and expensive computation live on the server. And it lets <strong>thin clients stay light</strong> while servers absorb scale.",
      "In this roadmap it is the substrate beneath everything. APIs are the language of the request-response arrow; load balancers and caches make that arrow fast and reliable. When you start any mobile design, the first invisible decision is <strong>where to draw the client-server line</strong> &mdash; what runs on the device vs the server."
    ],
    example:[
      "Open Instagram and tap like on a photo. Your iPhone (client) fires a request &mdash; roughly <code>POST /media/&lt;id&gt;/like</code> &mdash; through <code>URLSession</code> to Instagram servers. The server validates you are allowed, records the like, increments the count and responds. Later your friend phone (a different client) requests that post and receives the updated count.",
      "Neither phone trusts the other or talks to the database directly; the server mediates everything and is the single source of truth. The photo pixels do not come from the app server at all &mdash; they are served from object storage via a CDN. That is the 3-tier split in one tap."
    ],
    interview:[
      "You are rarely asked this outright at SDE 2/3, but you demonstrate it in every design. The moment you sketch a mobile system you decide the <strong>client/server boundary</strong>: should the feed be ranked on the device or the server? (Server &mdash; it needs the full dataset, must stay consistent, and cannot trust the client.)",
      "The tradeoff to name is <strong>thick client vs thin client</strong>. A thick client does more on-device: it works offline and reduces server load, but is harder to update, less secure, and risks behaving differently across app versions in the wild. A thin client pushes logic to the server: instantly updatable, consistent, secure &mdash; but needs the network and adds latency. Mobile lives in the middle: enough on-device for a responsive, offline-tolerant feel, with the server as the unquestioned source of truth."
    ],
    resources:[
      {label:"AlgoMaster — Client-Server Architecture Explained", url:"https://blog.algomaster.io/p/client-server-architecture-explained", note:"Best starting point — system-design focused"},
      {label:"InterviewBit — Client-Server Architecture (tiers)", url:"https://www.interviewbit.com/blog/client-server-architecture/", note:"1 / 2 / 3-tier breakdown with diagrams"},
      {label:"YouTube — search: client server architecture system design", url:"https://www.youtube.com/results?search_query=client+server+architecture+system+design", note:"Reliable channels: ByteByteGo, Gaurav Sen"},
      {label:"Apple — URLSession (URL Loading System)", url:"https://developer.apple.com/documentation/foundation/urlsession", note:"How your iOS app actually IS the client"}
    ],
    oneliner:"Client asks, server answers and owns the truth; the key decision is where to draw the client/server line — thick vs thin client."
  },

  2: {
    concept:[
      "HTTP is the request-response protocol clients and servers speak. But the <strong>lifecycle</strong> is the whole journey from tap to pixels, which is more than the HTTP message itself. The steps: (1) parse the URL, (2) <strong>DNS</strong> resolves the name to an IP, (3) a <strong>TCP</strong> connection is opened (3-way handshake), (4) if HTTPS, a <strong>TLS handshake</strong> sets up encryption, (5) the client sends the HTTP request, (6) the server does its work (auth, logic, database), (7) it returns a response, (8) the client parses and renders, (9) the connection is reused (keep-alive) or closed.",
      "Anatomy of a <strong>request</strong>: a method (GET/POST/&hellip;), a path, headers, and an optional body. Anatomy of a <strong>response</strong>: a status code (200, 404, 500&hellip;), headers, and a body. HTTP is also <strong>stateless</strong> &mdash; each request is independent and the server does not remember you between requests, so every request must carry its own identity (an auth token).",
      "Versions matter for performance: HTTP/1.1 added keep-alive (reuse a connection), HTTP/2 multiplexes many requests over one connection, and HTTP/3 runs over QUIC for faster setup and better behaviour on flaky mobile networks."
    ],
    why:[
      "Seeing the full lifecycle shows you <strong>where latency hides</strong>. DNS + TCP + TLS are setup costs paid before a single byte of your data moves &mdash; and on mobile the cellular radio must also wake up. That is why the first request to a host is slow and later ones (reused connection) are fast.",
      "It also explains the optimizations you will reach for later: connection reuse and keep-alive, HTTP/2 multiplexing, TLS session resumption, and batching requests so you pay setup costs less often."
    ],
    example:[
      "When your app calls <code>URLSession.shared.data(from:)</code> for the feed, all of those steps run under the hood. The first call to <code>api.example.com</code> pays DNS + TCP + TLS (often a few hundred ms on cellular); later calls reuse the connection and skip most of it &mdash; which is exactly why a cold launch feels slower than a warm one.",
      "The response arrives as <code>200 OK</code> with JSON, which you decode into your models. A <code>401 Unauthorized</code> means your token expired, so the app refreshes it and retries the same request."
    ],
    interview:[
      "You reference the lifecycle whenever you reason about latency or design the network layer. A senior signal: <em>the first request pays connection-setup cost (DNS + TCP + TLS), so I would keep connections warm, reuse the URLSession, and prefer HTTP/2</em>.",
      "Also tie in statelessness: because HTTP forgets you between requests, each request carries its auth token &mdash; which is why we store tokens and attach them per request. Tradeoff to name: persistent connections are faster but hold resources open, vs opening fresh connections each time."
    ],
    resources:[
      {label:"MDN — An overview of HTTP", url:"https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", note:"Canonical, accurate reference for the protocol"},
      {label:"GitHub — what-happens-when (typing a URL, deep dive)", url:"https://github.com/alex/what-happens-when", note:"The famous step-by-step of the whole journey"},
      {label:"Blog — The HTTP Request Lifecycle (browser to server)", url:"https://www.furkanbaytekin.dev/blogs/software/the-http-request-lifecycle-what-happens-from-browser-to-server", note:"Readable walkthrough incl. DNS/TCP/TLS"},
      {label:"YouTube — search: what happens when you type a URL", url:"https://www.youtube.com/results?search_query=what+happens+when+you+type+a+url+into+your+browser", note:"Reliable channels: ByteByteGo, Hussein Nasser"}
    ],
    oneliner:"Tap → DNS → TCP → TLS → request → server → response → render; setup (DNS/TCP/TLS) is where first-request latency hides, and HTTP is stateless so each request carries its own auth."
  },

  3: {
    concept:[
      "DNS (Domain Name System) is the internet phonebook: it translates a human-friendly name like <code>api.instagram.com</code> into an IP address the network can actually route to. Humans use names; machines use numbers.",
      "A lookup is hierarchical and cached. Your device first checks local caches (app/OS). On a miss it asks a <strong>resolver</strong> (your ISP, or a public one like Cloudflare 1.1.1.1 / Google 8.8.8.8). The resolver walks the hierarchy: <strong>root</strong> &rarr; <strong>TLD</strong> (the .com servers) &rarr; the domain authoritative nameserver, which holds the real record and returns the IP. Every layer caches the answer for a time window called the <strong>TTL</strong>, so repeat lookups are instant.",
      "You will mostly meet <strong>A</strong> records (name &rarr; IPv4), <strong>AAAA</strong> (IPv6), and <strong>CNAME</strong> (an alias pointing one name at another)."
    ],
    why:[
      "It is step 2 of every single request, so it is a hidden <strong>latency</strong> source: a cold lookup adds round trips before your data even starts. It is also an <strong>availability</strong> factor &mdash; if DNS is slow or down, your app cannot reach anything, even when the servers themselves are perfectly healthy. Caching and TTLs exist to keep repeat lookups fast.",
      "Mobile angle: switching networks (wifi to cellular) can invalidate cached resolutions, and DNS-over-HTTPS is increasingly used for privacy. CDNs also lean on DNS to route you to the nearest edge server (see Step 008)."
    ],
    example:[
      "Your app hits <code>api.example.com</code>. iOS checks its DNS cache first; on a miss it queries the configured resolver, which returns the IP and caches it for the TTL. You never write this in code &mdash; <code>URLSession</code> handles it &mdash; but it is why the very first call after launch, or right after a network switch, can be a touch slower.",
      "It is also why an app sometimes shows <em>cannot connect</em> while the backend is actually fine: the request never left because DNS resolution failed."
    ],
    interview:[
      "Rarely a deep topic on its own, but name it inside your latency breakdown: <em>DNS resolution is one of the connection-setup costs before the request flows</em>. Mention TTL/caching, that DNS can be a single point of failure, and that CDNs use DNS to send users to a nearby edge.",
      "If pushed, note DNS-over-HTTPS for privacy and that very low TTLs trade faster failover for more lookup overhead."
    ],
    resources:[
      {label:"Cloudflare Learning — What is DNS?", url:"https://www.cloudflare.com/learning/dns/what-is-dns/", note:"The canonical, clear explainer with the resolution walkthrough"},
      {label:"How DNS Works (illustrated comic)", url:"https://howdns.works/", note:"Fun, beginner-friendly visual story"},
      {label:"YouTube — search: how DNS works explained", url:"https://www.youtube.com/results?search_query=how+dns+works+explained", note:"Reliable: Cloudflare, PowerCert Animated"}
    ],
    oneliner:"DNS turns a name into an IP via a cached root→TLD→authoritative walk; it is a hidden setup-latency cost and a real single point of failure."
  },

  4: {
    concept:[
      "HTTPS is just HTTP carried over <strong>TLS</strong>. TLS does three things: <strong>encryption</strong> (nobody in the middle can read the data), <strong>integrity</strong> (nobody can tamper with it), and <strong>authentication</strong> (you are really talking to instagram.com, not an impostor).",
      "The handshake happens after TCP connects. Simplified: the client sends a <em>hello</em> (its TLS versions, supported cipher suites, and random bytes); the server replies with its chosen cipher, its <strong>certificate</strong>, and its own random bytes; the client <strong>verifies the certificate</strong> against a trusted Certificate Authority to confirm the server identity; then both sides derive a shared <strong>session key</strong>. From there they switch to fast <strong>symmetric</strong> encryption for the rest of the session.",
      "Slow asymmetric crypto is used only to set up the keys; fast symmetric crypto does the bulk. <strong>TLS 1.3</strong> trimmed the handshake to a single round trip (and zero round trips when resuming a prior session), which is a real win on high-latency mobile links."
    ],
    why:[
      "Security is the point: confidentiality, integrity, and server authentication. It is non-negotiable for any app handling user data, and iOS effectively requires it (App Transport Security blocks plain HTTP by default).",
      "But it has a <strong>performance cost</strong>: the handshake adds round trips before your data flows &mdash; expensive on cellular. Session resumption and TLS 1.3 reduce it, and keeping connections warm avoids repeating it. This is also the backdrop for certificate pinning (Step 101)."
    ],
    example:[
      "iOS App Transport Security (ATS) requires HTTPS by default, so your <code>URLSession</code> calls run over TLS automatically. When you hit <code>https://api.example.com</code>, the handshake validates the server certificate against the system trust store; if it is expired or invalid, the request simply fails.",
      "For higher-assurance apps (banking, health), teams add <strong>certificate pinning</strong>: the app ships knowing its server certificate or public key, so even a compromised Certificate Authority cannot impersonate the backend."
    ],
    interview:[
      "Name it as part of both connection-setup latency and security. Senior signals: <em>the TLS handshake adds a round trip, so TLS 1.3 and session resumption matter on mobile</em>; <em>for a sensitive app I would pin the certificate</em>; <em>tokens always travel over HTTPS, never plain HTTP</em>.",
      "Tradeoff to name: certificate pinning hardens security but complicates certificate rotation &mdash; if you rotate the cert without shipping an app update, you can lock users out."
    ],
    resources:[
      {label:"Cloudflare — What happens in a TLS handshake?", url:"https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/", note:"Step-by-step of the handshake (canonical)"},
      {label:"Cloudflare — What is HTTPS?", url:"https://www.cloudflare.com/learning/ssl/what-is-https/", note:"How HTTP + TLS fit together"},
      {label:"YouTube — search: TLS handshake explained", url:"https://www.youtube.com/results?search_query=tls+handshake+explained", note:"Reliable: Cloudflare, Hussein Nasser"}
    ],
    oneliner:"HTTPS = HTTP over TLS; the handshake authenticates the server via its certificate and sets up a shared session key, costing round trips that TLS 1.3 / resumption reduce."
  },

  5: {
    concept:[
      "Three metrics that get confused constantly. <strong>Latency</strong> is how long one round trip takes (the delay), in milliseconds. <strong>Bandwidth</strong> is the theoretical maximum capacity of the pipe (how much could flow per second), e.g. Mbps. <strong>Throughput</strong> is the data rate you actually achieve in practice &mdash; always at or below bandwidth, because congestion, packet loss, latency, and protocol overhead eat into it.",
      "Pipe analogy: <strong>bandwidth</strong> is the pipe width (max capacity), <strong>throughput</strong> is how much water actually flows, and <strong>latency</strong> is how long it takes one drop to travel end to end. A wide pipe that is very long still delays the first drop.",
      "The key insight: <strong>bandwidth and latency are independent</strong>. Adding bandwidth does not fix latency. A satellite link can have huge bandwidth and terrible latency."
    ],
    why:[
      "On mobile, <strong>latency usually dominates the felt experience</strong> for normal app interactions, because payloads are small. A feed request is a few KB &mdash; what makes it feel slow is the round trip (and connection setup), not the pipe width. Bandwidth and throughput dominate only for big transfers: video, photo upload.",
      "This reframes optimization: to feel fast, <strong>reduce round trips</strong> (fewer requests, batch them, cache, prefetch) rather than only shrinking payloads. Throughput is also what you actually get on a metered, variable mobile link, so design for the real number, not the advertised one."
    ],
    example:[
      "Loading a text feed of 20 posts is only a few KB. Even on fast wifi it can feel laggy if latency is 300 ms &mdash; because the bottleneck is the round trip, not the data size. Downloading a 4K video is the opposite: now bandwidth and throughput dominate.",
      "So for the feed you optimize round trips (one batched request, cache-first), and for video you optimize throughput (adaptive bitrate, chunking). Recognizing <em>which</em> metric is the bottleneck for a given feature is the actual skill."
    ],
    interview:[
      "High value, because most candidates conflate these. Senior signal: <em>for this feature the bottleneck is latency, not bandwidth, so I would cut round trips with batching, caching, and prefetch rather than just compressing the payload</em>. For SDE3, know the percentile framing &mdash; p50 vs p99 latency &mdash; since tail latency is what users actually complain about.",
      "Tradeoff to name: prefetching reduces perceived latency but wastes bandwidth and battery if the user never needs the prefetched data."
    ],
    resources:[
      {label:"Kentik — Latency vs Throughput vs Bandwidth", url:"https://www.kentik.com/kentipedia/latency-vs-throughput-vs-bandwidth/", note:"Clear, with the highway/pipe analogy"},
      {label:"TechTarget — Bandwidth vs throughput: what is the difference", url:"https://www.techtarget.com/searchnetworking/feature/Network-bandwidth-vs-throughput-Whats-the-difference", note:"Tightens the bandwidth vs throughput distinction"},
      {label:"GeeksforGeeks — Latency vs Throughput", url:"https://www.geeksforgeeks.org/computer-networks/difference-between-latency-and-throughput/", note:"Quick reference with examples"}
    ],
    oneliner:"Latency = round-trip delay, bandwidth = max capacity, throughput = what you actually get; on mobile latency usually rules, so cut round trips, not just payload size."
  },

  6: {
    concept:[
      "Picture a small restaurant where one friendly waiter takes care of you the whole evening. He remembers your name, your order, that you wanted no onions. Lovely &mdash; until his shift ends. The new waiter walks over with no idea who you are, and you have to explain everything again. That first waiter is a <strong>stateful server</strong>: he keeps your <strong>session</strong> in his own head.",
      "Now picture a different place where, every time you order, you hand over a little ticket with everything written on it &mdash; who you are, what you want. Any waiter can read the ticket and serve you, because the ticket carries all the context. That is a <strong>stateless server</strong>: it keeps <strong>no memory of you between requests</strong>, so each request must bring everything needed to handle it.",
      "One myth to kill: <em>stateless</em> does not mean there is no state anywhere. It means the state does not live inside that one server&rsquo;s memory &mdash; it is stored <strong>outside</strong>, in a token the client carries, or in a shared place every server can read like a database or a fast cache (<strong>Redis</strong>, <strong>Memcached</strong>)."
    ],
    why:[
      "Statelessness is what makes modern systems easy to <strong>scale</strong> and hard to break. Remember the host-at-the-door (the load balancer, next step) spreading requests across many servers? If the servers are stateless, <strong>any server can handle any request</strong>, so traffic flows freely &mdash; and if one server dies, you lose nothing, because it was never holding your session.",
      "The stateful way needs <strong>sticky sessions</strong>: the system must keep sending you back to the exact same server that remembers you. That unbalances load and, worse, if that server crashes, your session vanishes. So the common pattern is: keep the app servers <strong>stateless</strong>, and push the real state into a shared store. The single server is stateless; the system as a whole still has state."
    ],
    example:[
      "This is the reason your iOS app attaches an <strong>auth token</strong> (often a <code>Bearer</code> JWT in the <code>Authorization</code> header) to <em>every</em> request. The app never assumes the server remembers it is logged in &mdash; it re-proves its identity each time. That is the client side of statelessness, and it is exactly what lets a backend like Instagram or WhatsApp serve millions of phones from a swarm of interchangeable servers.",
      "The token is your little ticket. Lose it (it expires) and the server hands back a <code>401</code>; the app quietly gets a fresh ticket and carries on."
    ],
    interview:[
      "Common and high-value. The line that sounds senior: <em>I would keep the API servers stateless so they scale horizontally behind the load balancer and survive failures; session state lives in the token and/or a shared store like Redis</em>. Name sticky sessions as the stateful workaround and its downsides (uneven load, sessions lost on crash).",
      "Tradeoff to say out loud: stateless costs a little overhead (each request re-sends auth and may re-fetch state) but buys huge scalability and resilience; stateful is faster and simpler at small scale but painful once you need many servers."
    ],
    resources:[
      {label:"freeCodeCamp — Stateful vs Stateless Architectures Explained", url:"https://www.freecodecamp.org/news/stateful-vs-stateless-architectures-explained/", note:"Beginner-friendly with clear analogies"},
      {label:"Hayk Simonyan — Stateful vs Stateless (the waiter story)", url:"https://hayksimonyan.substack.com/p/stateful-vs-stateless-architectures", note:"Short, story-driven walkthrough"},
      {label:"GeeksforGeeks — Stateful vs Stateless Architecture", url:"https://www.geeksforgeeks.org/system-design/stateful-vs-stateless-architecture/", note:"Quick reference + tradeoffs"},
      {label:"YouTube — search: stateful vs stateless system design", url:"https://www.youtube.com/results?search_query=stateful+vs+stateless+system+design", note:"Reliable: ByteByteGo, Gaurav Sen"}
    ],
    oneliner:"A stateless server remembers nothing between requests, so each request carries its own identity (a token) — which lets any server handle any request and the system scale and survive failures."
  },

  7: {
    concept:[
      "Imagine a popular clinic with a single receptionist. As more patients pour in, that one person drowns and the queue stalls &mdash; and the day she is off sick, the whole clinic grinds to a halt. So the clinic hires several receptionists and puts a calm host at the door who glances at who is free and points each arriving patient to the right desk. That host is a <strong>load balancer</strong>.",
      "In tech terms, a load balancer sits in front of a group of <strong>identical servers</strong> and <strong>distributes incoming requests</strong> across them, so no single server is overwhelmed. Your app talks to one address (<code>api.example.com</code>), and the load balancer quietly decides which real machine answers.",
      "How does it choose? Using <strong>load balancing algorithms</strong> &mdash; <strong>round robin</strong> (take turns), <strong>least connections</strong> (send to the least-busy server), or geo/IP routing (send you to the nearest region, called <strong>GSLB</strong>). It also runs constant <strong>health checks</strong>: it pings each server and, the moment one looks sick, stops routing to it &mdash; that automatic rerouting is <strong>failover</strong>."
    ],
    why:[
      "It does two jobs at once. <strong>Scalability</strong>: spread the load so you can simply add more servers as users grow. <strong>High availability</strong>: if a server dies, route around it with no downtime, so there is no <strong>single point of failure</strong>. It is also the piece that makes &lsquo;stateless servers&rsquo; actually pay off &mdash; interchangeable servers are only useful if something is fairly handing out the work.",
      "Bonus insight: this is why a request that just failed often succeeds on <strong>retry</strong> &mdash; the second attempt may land on a healthy server."
    ],
    example:[
      "You never see it, but it is why your app speaks to a single hostname while hundreds of machines actually serve it. It is also why a brief hiccup sometimes clears the instant you retry: the balancer quietly moved you to a healthy server.",
      "When you design photo upload or a feed, you assume the backend is many servers behind a balancer &mdash; which is exactly why your client must tolerate landing on a &lsquo;fresh&rsquo; server that has no memory of you. (That is statelessness and load balancing working hand in hand.)"
    ],
    interview:[
      "You will draw it in almost every high-level design, sitting between the client and the app servers. Senior signal: <em>requests hit a load balancer that spreads them across stateless app servers using health checks and failover, so we scale horizontally and avoid a single point of failure</em>. Name an algorithm or two (round robin, least connections) and mention GSLB for routing users to the nearest region.",
      "Tradeoff to name: the load balancer itself could become a single point of failure, so in real systems it is made redundant too (multiple balancers)."
    ],
    resources:[
      {label:"Cloudflare Learning — What is load balancing?", url:"https://www.cloudflare.com/learning/performance/what-is-load-balancing/", note:"Canonical, clear explainer"},
      {label:"Cloudflare — Types of load balancing algorithms", url:"https://www.cloudflare.com/learning/performance/types-of-load-balancing-algorithms/", note:"Round robin, least connections, GSLB"},
      {label:"YouTube — search: load balancer system design", url:"https://www.youtube.com/results?search_query=load+balancer+system+design+explained", note:"Reliable: ByteByteGo, Gaurav Sen"}
    ],
    oneliner:"A load balancer is the host at the door that spreads requests across many identical servers (with health checks + failover) — giving you horizontal scaling and high availability."
  },

  8: {
    concept:[
      "Imagine a famous bakery in Paris. If everyone on Earth had to wait for bread shipped from that one shop, it would be slow and absurdly expensive. So the bakery opens small branches in every city that keep copies of the popular loaves. Now you grab bread from the branch around the corner &mdash; fast and fresh. A <strong>CDN</strong> is that network of local branches, but for web content.",
      "A <strong>CDN (content delivery network)</strong> is a <strong>geographically distributed</strong> group of servers &mdash; called <strong>edge servers</strong> or <strong>points of presence (PoPs)</strong> &mdash; that <strong>cache</strong> copies of your <strong>static content</strong> (images, video, CSS, JavaScript) physically close to users. Instead of every request crossing the planet to your one <strong>origin server</strong>, it is served from a nearby edge, slashing <strong>latency</strong>.",
      "How it works: the first request for a file in a region is a <strong>cache miss</strong> &mdash; the edge has no copy, so it fetches from the origin and stores it for a set time (<strong>TTL</strong>). Every later nearby request is a <strong>cache hit</strong>, served instantly. Routing you to the closest edge is handled via <strong>DNS / anycast</strong>."
    ],
    why:[
      "Three wins. <strong>Speed</strong>: closer servers mean lower latency and faster loads. <strong>Scale and cost</strong>: the CDN absorbs the bulk of requests, so your origin is not hammered &mdash; this <strong>offloads the origin</strong> and saves bandwidth. <strong>Resilience and security</strong>: it soaks up traffic spikes and helps absorb <strong>DDoS</strong> attacks. The majority of the web&rsquo;s traffic &mdash; Netflix, Facebook, and friends &mdash; flows through CDNs.",
      "For mobile this is the backbone of any media-heavy app: it is why the same photo loads quickly for users on every continent."
    ],
    example:[
      "When your feed JSON returns image URLs like <code>img.cdn.example.com/photo.jpg</code>, those bytes do not come from your API server &mdash; they come from a CDN edge near the user. That is why images load fast even when your API lives on another continent. For video apps, the CDN streams chunks from the nearest edge.",
      "On the client you still keep your own local image cache too, so the layers stack neatly: device cache &rarr; CDN edge &rarr; origin server. Each layer it hits is faster than the next."
    ],
    interview:[
      "Bring it up for any media-heavy design &mdash; feed, photos, stories, video. Senior signal: <em>static assets are served from a CDN edge close to the user to cut latency and offload the origin; the API returns CDN URLs, not the bytes themselves</em>. Mention cache hit/miss, TTL, and that CDNs also smooth traffic spikes and help with DDoS.",
      "Tradeoff to name: <strong>cache invalidation</strong> &mdash; when content changes, edges may keep serving the stale copy until the TTL expires or you purge it. The common fix is <strong>versioned URLs</strong> (a hash or version in the filename, like <code>photo_v2.jpg</code>) so a change is simply a new URL."
    ],
    resources:[
      {label:"Cloudflare Learning — What is a CDN?", url:"https://www.cloudflare.com/learning/cdn/what-is-a-cdn/", note:"Canonical explainer of how a CDN works"},
      {label:"GeeksforGeeks — What is a CDN (overview)", url:"https://www.geeksforgeeks.org/computer-networks/what-is-cloudflare/", note:"Plain-language overview"},
      {label:"YouTube — search: how a CDN works", url:"https://www.youtube.com/results?search_query=how+cdn+works+explained", note:"Reliable: ByteByteGo, Cloudflare"}
    ],
    oneliner:"A CDN is a network of local branches caching your static content at the edge near users — cutting latency, offloading the origin, and absorbing spikes; the API hands out CDN URLs, not the bytes."
  },

  9: {
    concept:[
      "Picture a giant valet warehouse. You walk up, hand over any item &mdash; a coat, a bike, a piano &mdash; and you get back a little ticket with a unique number. You have no idea <em>where</em> in the warehouse your stuff goes, and you do not care: whenever you want it back, you show the ticket and it appears. There are no aisles or folders for you to navigate; it is one enormous flat space holding millions of items, each found instantly by its ticket. That is <strong>object storage</strong>.",
      "<strong>Object storage</strong> (the famous one is <strong>Amazon S3</strong>; Azure calls it <strong>Blob storage</strong>) keeps each file as a self-contained <strong>object</strong> with a unique <strong>key</strong> and some <strong>metadata</strong>, sitting in a container called a <strong>bucket</strong>. You store and fetch whole objects by key over a simple web (HTTP) API. It is built for massive amounts of <strong>unstructured data</strong> &mdash; images, videos, audio, backups &mdash; and is famously <strong>scalable</strong> and <strong>durable</strong> (your data is copied across many machines and locations).",
      "It helps to place it against its two cousins. <strong>Block storage</strong> is the raw, fast disk split into fixed blocks (great for databases and operating systems, e.g. Amazon EBS). <strong>File storage</strong> is the familiar folders-and-subfolders hierarchy. <strong>Object storage</strong> gives up the ability to edit part of a file in place, and in exchange gets near-infinite scale, simplicity, and durability."
    ],
    why:[
      "Big media files do not belong in a <strong>database</strong> &mdash; databases are for structured, queryable, relational data, and they choke on giant blobs. So the pattern is: the database stores a tiny <strong>URL or key</strong>, and the actual bytes live in object storage, which is cheap, endlessly scalable, and extremely durable.",
      "And because objects are reachable over plain HTTP, object storage pairs perfectly with a <strong>CDN</strong> (Step 008): the CDN caches objects from the <strong>origin</strong> bucket and serves them from the edge. This is literally where the photos and videos in your app live."
    ],
    example:[
      "When a user uploads a profile photo, your app usually does not send it through your API server. Instead the server hands the app a temporary <strong>pre-signed URL</strong>, and the app uploads the image <em>straight to object storage</em>. The server then saves just the resulting key/URL in the database.",
      "Later, the feed JSON returns that URL (typically a CDN URL sitting in front of the bucket), and the app downloads the bytes directly. So the roles line up cleanly: the <strong>database</strong> is the index card with the address, <strong>object storage</strong> is the warehouse holding the actual photo, and the <strong>CDN</strong> is the local branch caching it near the user."
    ],
    interview:[
      "Raise it the moment a design involves images, video, audio, file uploads, or backups. Senior signal: <em>large binary assets go in object storage like S3, the database stores only the key/URL, and a CDN sits in front for fast delivery; the client uploads via a pre-signed URL so bytes never pass through the app server</em>. Mention durability and scalability, and the block-vs-file-vs-object distinction if probed.",
      "Tradeoff to name: object storage is wrong for data you edit in place or query relationally &mdash; you read and write whole objects, and per-object latency is higher than block storage, so never put your transactional database on it."
    ],
    resources:[
      {label:"Cloudflare Learning — Object storage vs block storage", url:"https://www.cloudflare.com/learning/cloud/object-storage-vs-block-storage/", note:"Clear contrast of the storage types"},
      {label:"IBM — Object vs File vs Block Storage", url:"https://www.ibm.com/think/topics/object-vs-file-vs-block-storage", note:"All three side by side"},
      {label:"DEV — AWS Storage explained (the valet-warehouse analogy)", url:"https://dev.to/pkkolla/aws-storage-explained-choosing-between-file-block-and-object-storage-like-a-pro-2061", note:"Story-driven, beginner-friendly"},
      {label:"YouTube — search: what is object storage S3", url:"https://www.youtube.com/results?search_query=what+is+object+storage+amazon+s3", note:"Reliable: AWS, ByteByteGo"}
    ],
    oneliner:"Object storage (S3) keeps whole files as objects fetched by a unique key in a flat, hugely scalable space; the database stores the URL, the bytes live in the bucket, and a CDN serves them from the edge."
  },

  10: {
    concept:[
      "Imagine you are studying. The library has every book, but it is a 20-minute walk away. So the handful of books you are using right now you keep on your desk &mdash; instant to grab. That desk is a <strong>cache</strong>: a small, fast store holding copies of the things you use most, right where you need them, so you avoid the slow trip to the source.",
      "When you reach for a book and it is already on the desk, that is a <strong>cache hit</strong> (fast). When it is not there and you have to walk to the library, that is a <strong>cache miss</strong> &mdash; you fetch it from the source and drop a copy on the desk for next time. In tech the source is a database, a network call, or a disk.",
      "Your desk is small, so two rules appear. When it fills up, you put back the book you have not touched in the longest while &mdash; that is <strong>eviction</strong>, and the most common policy is <strong>LRU (least recently used)</strong> (others: <strong>LFU</strong> least-frequently-used, <strong>FIFO</strong> oldest-out). And because a copy can go out of date, each gets a shelf-life called <strong>TTL (time to live)</strong>, after which it expires &mdash; part of the wider problem of <strong>cache invalidation</strong> (refreshing or removing data when the source changes). Caches live at every layer: <strong>client-side</strong> (your app), the <strong>CDN edge</strong>, and <strong>server-side</strong> (a shared cache like <strong>Redis</strong> or <strong>Memcached</strong> in front of the database)."
    ],
    why:[
      "Caching is often the single biggest performance win in a system: it turns a slow lookup (milliseconds or more) into a fast memory lookup (microseconds), and it shields the database from being hammered &mdash; cutting <strong>load</strong>, saving cost, and improving <strong>scalability</strong>. There is a famous joke that the two hardest things in computing are <strong>cache invalidation</strong> and naming things, precisely because keeping copies fresh is genuinely tricky.",
      "On mobile this is <em>the</em> core pattern (remember the repository from Step 001): show cached data instantly so the screen is never blank, then quietly refresh from the network. Caching is how apps feel fast and keep working when the network is flaky."
    ],
    example:[
      "Your app keeps the feed in memory (<code>NSCache</code>) and on disk, so on launch it paints the cached feed instantly (<strong>cache hit</strong>) and refreshes in the background. It caches downloaded images so scrolling back up does not re-download them. Tokens, profile, settings &mdash; all cached.",
      "On the server, a celebrity profile that millions request per minute is kept in <strong>Redis</strong> so the database is not crushed. Each layer in the chain &mdash; device cache &rarr; CDN edge &rarr; server cache &rarr; database &mdash; is faster than the one behind it, so you always answer from the closest layer that has the data."
    ],
    interview:[
      "Caching appears in nearly every design and is high-yield. Senior signals: say <em>where</em> the cache lives (client / CDN / server-side Redis), pick an eviction policy (LRU is the safe default), set a <strong>TTL</strong> for freshness, and &mdash; the part most people forget &mdash; explain how you <strong>invalidate</strong> when data changes. Bonus points for naming a <strong>cache stampede</strong> (a hot key expires and a flood of misses hits the database at once) and fixes like TTL jitter or request coalescing.",
      "Tradeoff to name: caching trades freshness for speed. Stale data is the price; the stricter your consistency requirement, the more careful and immediate your invalidation must be."
    ],
    resources:[
      {label:"Hello Interview — Caching for System Design", url:"https://www.hellointerview.com/learn/system-design/core-concepts/caching", note:"Excellent, interview-focused overview"},
      {label:"DEV — Caching Explained: the biggest performance win", url:"https://dev.to/rajkiran_389/system-design-8-caching-caching-explained-the-single-biggest-performance-win-in-any-system-22el", note:"Hits, misses, eviction, stampede"},
      {label:"GeeksforGeeks — Caching (system design for beginners)", url:"https://www.geeksforgeeks.org/system-design/caching-system-design-concept-for-beginners/", note:"Plain-language reference"},
      {label:"YouTube — search: caching system design", url:"https://www.youtube.com/results?search_query=caching+system+design+explained", note:"Reliable: ByteByteGo, Gaurav Sen"}
    ],
    oneliner:"A cache is a small fast store of hot data near where it is needed; hits are fast, misses fetch from source, eviction (LRU) frees space, and TTL/invalidation keep it fresh — trading freshness for big speed and load wins."
  },

  11: {
    concept:[
      "You want to tell a friend something, but their phone is in their pocket, screen off, your app not even running &mdash; you cannot just barge into their house. So you hand your message to the postal service, which already has a standing relationship with every household and knows how to deliver the moment they are reachable. For iPhones, that postal service is <strong>APNs &mdash; the Apple Push Notification service</strong>.",
      "A server cannot open a connection to a sleeping app on an iPhone, so push always goes through this middleman. Your backend (the <strong>provider</strong>) sends the notification to APNs, and APNs &mdash; which keeps a single <strong>persistent connection</strong> open to every Apple device &mdash; delivers it, even when your app is closed.",
      "The flow has four beats: (1) the app asks the user&rsquo;s permission and <strong>registers</strong>, getting a unique <strong>device token</strong> from APNs (think of it as the device&rsquo;s mailing address for your app); (2) the app sends that token to your backend; (3) when there is news, your backend sends a <strong>payload</strong> plus the device token to APNs, authenticated with a key or certificate; (4) APNs routes it to the right device, and iOS shows the <strong>alert</strong> (or, for a <strong>silent / background push</strong>, quietly wakes the app to fetch data)."
    ],
    why:[
      "It is the only way to reach a user when your app is not running &mdash; the foundation of every &lsquo;you have a new message&rsquo; banner, breaking-news alert, and chat ping. It is also deliberately <strong>battery-friendly</strong>: instead of every app draining power keeping its own connection alive, the operating system maintains <em>one</em> shared connection to APNs for all apps.",
      "It is also the one place where the server <strong>pushes to the device</strong> rather than the device pulling &mdash; which is why it reappears later as a real-time-update option (silent push, Step 085) and as the heart of a notifications system (Step 100)."
    ],
    example:[
      "WhatsApp: a friend messages you while the app is closed. WhatsApp&rsquo;s server cannot reach your phone directly, so it hands the message and your <strong>device token</strong> to APNs, which delivers the banner. Tapping it deep-links straight into the chat.",
      "A <strong>silent push</strong> can also wake the app in the background for a moment to download new data before anything is even shown &mdash; so the conversation is already loaded when you open it."
    ],
    interview:[
      "Bring it up for chat, social, news, and any &lsquo;notify the user&rsquo; feature, and as one option when discussing real-time updates. Senior signal: <em>the backend cannot reach a sleeping app, so it sends through APNs using the device token; for data sync we can use a silent/background push to wake the app and fetch</em>. Mention the token-registration flow and the shared OS connection for battery efficiency.",
      "Tradeoff to name: push is <strong>best-effort</strong>, not guaranteed or instant (APNs may delay or coalesce messages), so never rely on it as your only sync path &mdash; always pair it with a fetch on app open. Also remember device tokens can change and must be kept fresh on your backend."
    ],
    resources:[
      {label:"Apple — User Notifications (official framework docs)", url:"https://developer.apple.com/documentation/usernotifications", note:"The authoritative iOS source"},
      {label:"NSHipster — APNs Device Tokens", url:"https://nshipster.com/apns-device-tokens/", note:"Clear, iOS-developer-focused explainer"},
      {label:"Educative — What is APNs?", url:"https://www.educative.io/answers/what-is-apple-push-notification-service-apns", note:"Step-by-step of the registration + delivery flow"},
      {label:"YouTube — search: iOS push notifications APNs explained", url:"https://www.youtube.com/results?search_query=ios+push+notifications+apns+explained", note:"Reliable: Apple WWDC, iOS Academy"}
    ],
    oneliner:"A server cannot reach a sleeping app, so it sends through APNs using the device's token; one shared OS connection delivers pushes battery-efficiently — best-effort, so always pair it with a fetch on open."
  },

  12: {
    concept:[
      "Imagine talking to a librarian about a shelf of books (the <strong>resource</strong>). The shelf has one address, but you can ask for very different things: &lsquo;show me this book&rsquo; (read it, change nothing), &lsquo;add this new book&rsquo;, &lsquo;replace this book with a new edition&rsquo;, &lsquo;just fix the typo on page 5&rsquo;, or &lsquo;remove this book&rsquo;. The action you want is the <strong>verb</strong>; the shelf is the noun. <strong>HTTP methods</strong> are exactly those verbs.",
      "The five everyday ones map to <strong>CRUD</strong> (Create, Read, Update, Delete): <strong>GET</strong> reads, <strong>POST</strong> creates, <strong>PUT</strong> replaces the whole thing, <strong>PATCH</strong> updates part of it, <strong>DELETE</strong> removes it. (There are a few more like HEAD and OPTIONS, but these five are the workhorses.)",
      "Two properties matter enormously. A method is <strong>safe</strong> if it changes nothing on the server (GET is safe). A method is <strong>idempotent</strong> if doing it once or a hundred times leaves the same result &mdash; <strong>GET, PUT, and DELETE are idempotent</strong>, while <strong>POST and PATCH are not</strong> (call &lsquo;create order&rsquo; twice and you get two orders)."
    ],
    why:[
      "Predictability. Because everyone agrees on the verbs, any developer &mdash; and the whole web (browsers, proxies, CDNs) &mdash; understands an endpoint from its method alone: GET can be cached and prefetched, while POST should only fire on real user intent.",
      "Idempotency is the big one for mobile, because the network is flaky and requests get <strong>retried</strong>. If a method is idempotent, a retry is harmless even if the first attempt secretly succeeded. For non-idempotent calls (a payment POST), you attach an <strong>idempotency key</strong> &mdash; a unique id the server remembers, so a retry returns the original result instead of charging twice. This connects straight to retries (Step 028) and idempotency keys (Step 092)."
    ],
    example:[
      "In your app: load the feed is <code>GET /feed</code>; like a post is a <code>POST</code>; editing your whole profile is <code>PUT /profile</code> while changing just your bio is <code>PATCH /profile</code>; removing a comment is <code>DELETE /comments/42</code>.",
      "When a &lsquo;create payment&rsquo; <code>POST</code> times out on a weak signal, your app retries it with the same <code>Idempotency-Key</code> header, so the user is never double-charged &mdash; the exact pattern Stripe and other payment APIs use."
    ],
    interview:[
      "You apply the right verbs whenever you design an API contract. Senior signal: <em>GET for reads (safe, cacheable), POST to create, PUT/PATCH to update, DELETE to remove; I would keep writes idempotent where possible and use an idempotency key for non-idempotent POSTs so retries are safe on mobile</em>. Be precise about safe vs idempotent &mdash; people mix them up.",
      "Nuance to mention: PUT replaces the entire resource (you must send every field), while PATCH sends only what changed (smaller payload, but trickier semantics)."
    ],
    resources:[
      {label:"MDN — HTTP request methods", url:"https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods", note:"Canonical definitions"},
      {label:"REST API Tutorial — HTTP Methods (safe & idempotent)", url:"https://restfulapi.net/http-methods/", note:"Clear on idempotency and safety"},
      {label:"Postman — What are HTTP methods?", url:"https://blog.postman.com/what-are-http-methods/", note:"Practical, example-driven"},
      {label:"YouTube — search: HTTP methods REST explained", url:"https://www.youtube.com/results?search_query=http+methods+rest+api+explained", note:"Reliable: ByteByteGo, Fireship"}
    ],
    oneliner:"HTTP methods are the verbs on a resource — GET/POST/PUT/PATCH/DELETE (CRUD); GET is safe, GET/PUT/DELETE are idempotent (safe to retry), POST is not (use an idempotency key)."
  },

  13: {
    concept:[
      "Every time you ask the server for something, it answers with a three-digit code that tells you at a glance how it went &mdash; like a traffic light with a reason attached. The first digit is the <strong>category</strong>; the other two are the detail.",
      "There are five families. <strong>1xx</strong> informational (rare). <strong>2xx success</strong> &mdash; it worked (<code>200 OK</code>, <code>201 Created</code>, <code>204 No Content</code>). <strong>3xx redirection</strong> &mdash; look elsewhere (<code>301</code>/<code>302</code>, and <code>304 Not Modified</code> for caching). <strong>4xx client error</strong> &mdash; <em>you</em> messed up (<code>400</code> Bad Request, <code>401</code> Unauthorized, <code>403</code> Forbidden, <code>404</code> Not Found, <code>429</code> Too Many Requests). <strong>5xx server error</strong> &mdash; the <em>server</em> messed up (<code>500</code>, <code>502</code>, <code>503</code>).",
      "The handy mnemonic: the first digit tells you whose fault it is. <strong>4xx = the caller&rsquo;s problem</strong> (fix the request), <strong>5xx = the server&rsquo;s problem</strong> (check the server, usually transient). And know the pair: <code>401</code> means &lsquo;not logged in&rsquo;, while <code>403</code> means &lsquo;logged in but not allowed&rsquo;."
    ],
    why:[
      "It lets the client decide what to do next without even reading the body. <code>200</code> &rarr; use the data. <code>401</code> &rarr; token expired, refresh and retry. <code>404</code> &rarr; show an empty state. <code>429</code> &rarr; you are rate-limited, back off. <code>5xx</code> &rarr; transient, retry with backoff. The status code basically <em>is</em> your error-handling and retry strategy.",
      "A notorious anti-pattern: returning <code>200 OK</code> with the real error buried in the body. That lies to every layer &mdash; caches, monitoring, and your own client &mdash; so always return the honest code."
    ],
    example:[
      "Your networking layer switches on the code: <code>2xx</code> &rarr; decode the JSON; <code>401</code> &rarr; run the token-refresh flow then retry; <code>404</code> &rarr; show a friendly &lsquo;nothing here&rsquo;; <code>429</code> or <code>5xx</code> &rarr; retry with exponential backoff.",
      "The <code>401</code>-vs-<code>403</code> distinction decides the user experience: a <code>401</code> bounces them to the login screen, while a <code>403</code> shows a &lsquo;you do not have access&rsquo; message &mdash; logging in again would not help."
    ],
    interview:[
      "Shows up in API design and error handling. Senior signal: <em>return specific codes &mdash; 201 on create, 204 on delete, 401 vs 403 correctly, 429 for rate limits &mdash; and have the client retry 5xx and 429 with backoff but not 4xx, since those will not succeed unchanged</em>. Tie <code>304 Not Modified</code> to caching and ETags (Steps 031&ndash;032).",
      "Tradeoff: specific codes aid clients and debugging, but do not invent non-standard codes &mdash; stick to the well-understood semantics so every layer behaves correctly."
    ],
    resources:[
      {label:"MDN — HTTP response status codes", url:"https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", note:"The canonical full list"},
      {label:"Postman — What are HTTP status codes?", url:"https://blog.postman.com/what-are-http-status-codes/", note:"With API best practices (retries, specificity)"},
      {label:"REST API Tutorial — HTTP Status Codes", url:"https://restfulapi.net/http-status-codes/", note:"Concise per-family reference"},
      {label:"YouTube — search: HTTP status codes explained", url:"https://www.youtube.com/results?search_query=http+status+codes+explained", note:"Reliable: ByteByteGo, Fireship"}
    ],
    oneliner:"A 3-digit code says how a request went — 2xx success, 3xx redirect, 4xx your fault, 5xx server fault; the client uses it to react (refresh on 401, back off on 429/5xx, don't retry 4xx)."
  },

  14: {
    concept:[
      "If the URL is the address on an envelope and the body is the letter inside, then <strong>HTTP headers</strong> are the sticky notes on the outside: &lsquo;written in French&rsquo;, &lsquo;handle as fragile&rsquo;, &lsquo;here is my ID badge&rsquo;, &lsquo;you may reuse this for an hour&rsquo;. They do not carry the main content &mdash; they carry <strong>metadata</strong> about how to interpret and handle the message.",
      "Headers are simple <strong>key-value pairs</strong> attached to every request and response. <strong>Request headers</strong> go client&rarr;server; <strong>response headers</strong> go server&rarr;client.",
      "The ones you will actually touch: <code>Content-Type</code> (the body&rsquo;s format, e.g. <code>application/json</code>), <code>Accept</code> (what formats the client wants back &mdash; called <strong>content negotiation</strong>), <code>Authorization</code> (your credentials, usually <code>Bearer &lt;token&gt;</code>), <code>Cache-Control</code> and <code>ETag</code> (caching rules &mdash; Steps 031&ndash;032), <code>Cookie</code>/<code>Set-Cookie</code> (session), <code>User-Agent</code> (which client), plus security headers like <code>Content-Security-Policy</code>."
    ],
    why:[
      "Headers are where most &lsquo;surprising&rsquo; HTTP behaviour actually lives: a request failed because <code>Authorization</code> was missing, a stale screen showed because <code>Cache-Control</code> allowed it, the body parsed wrong because <code>Content-Type</code> was wrong. Experienced developers open the headers in DevTools <em>before</em> reading the body. Headers handle authentication, content negotiation, caching, and security &mdash; all the rules <em>around</em> the content.",
      "For mobile specifically: the <code>Authorization</code> header is how your <strong>stateless</strong> requests carry identity each time (remember Step 006), <code>Content-Type</code> tells the server you are sending JSON, and caching headers control how fresh your data is."
    ],
    example:[
      "A typical request your app sends carries three notes: <code>Authorization: Bearer &lt;jwt&gt;</code> (who I am), <code>Content-Type: application/json</code> (what I am sending), and <code>Accept: application/json</code> (what I want back). In <code>URLSession</code> you set these on the <code>URLRequest</code>.",
      "The response comes back with its own headers &mdash; <code>Content-Type</code>, <code>Cache-Control</code>/<code>ETag</code> so your cache knows how long the data stays fresh, and maybe <code>Retry-After</code> on a <code>429</code>. Forget the <code>Authorization</code> header and you get a <code>401</code>; set the wrong <code>Content-Type</code> and the server may reject or misread your body."
    ],
    interview:[
      "You will reference headers when designing the network layer, auth, and caching. Senior signal: <em>auth travels in the Authorization header as a Bearer token, content negotiation via Content-Type and Accept, and caching via Cache-Control and ETag</em>.",
      "Nuance to name: headers are for metadata, not bulk data &mdash; keep them small (some proxies cap header size), and never put secrets in the URL where they get logged; put them in headers instead."
    ],
    resources:[
      {label:"MDN — HTTP headers", url:"https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers", note:"Canonical reference for every header"},
      {label:"Postman — What are HTTP headers?", url:"https://blog.postman.com/what-are-http-headers/", note:"Request/response headers with examples"},
      {label:"How HTTP Works — HTTP Header (glossary)", url:"https://howhttpworks.com/glossary/header", note:"Short, intuitive mental model"},
      {label:"YouTube — search: HTTP headers explained", url:"https://www.youtube.com/results?search_query=http+headers+explained", note:"Reliable: Hussein Nasser, ByteByteGo"}
    ],
    oneliner:"Headers are key-value sticky notes of metadata on every request/response — Authorization (who you are), Content-Type/Accept (format), Cache-Control/ETag (freshness) — the rules around the content, not the content itself."
  },

  15: {
    concept:[
      "Picture a well-run hotel. Every room is a <em>thing</em> with a clear number (a <strong>resource</strong> with an address). You never tell the staff <em>how</em> to do their job step by step &mdash; you just make a standard request: &lsquo;check in&rsquo;, &lsquo;check out&rsquo;, &lsquo;clean room 304&rsquo;. Everyone uses the same predictable vocabulary, so any new staff member can work there without a manual. Designing your API like that hotel is <strong>REST</strong>.",
      "<strong>REST (Representational State Transfer)</strong> is a style for building APIs around <strong>resources</strong> (nouns) addressed by <strong>URLs</strong>, acted on with the standard <strong>HTTP methods</strong> (verbs). Its core principles: model resources as <strong>nouns, not verbs</strong> (use <code>/users/42</code>, never <code>/getUser</code>); use HTTP methods for the action; stay <strong>stateless</strong> (each request carries its own auth &mdash; remember Step 006); return a standard format (<strong>JSON</strong>); use proper <strong>status codes</strong>; and keep URLs <strong>predictable and consistent</strong> (plural nouns, shallow hierarchy like <code>/users/42/posts</code>).",
      "There is also a purist idea called <strong>HATEOAS</strong> (responses include links to related actions), but most real-world APIs keep things pragmatic and skip it."
    ],
    why:[
      "Predictability is the whole point. When every endpoint follows the same grammar, a developer understands it before reading any docs &mdash; integration is faster and bugs are fewer. <strong>Statelessness</strong> lets it scale horizontally (Steps 006&ndash;007), and because it rides on plain HTTP, <strong>caching</strong>, status codes, and methods all just work. That simplicity is exactly why REST became the default API style.",
      "For mobile, REST is usually what your app&rsquo;s <strong>API contract</strong> is &mdash; and clean, consistent endpoints keep your networking layer simple."
    ],
    example:[
      "A RESTful feed API reads cleanly: <code>GET /v1/users/42/feed?limit=20</code> to read, <code>POST /v1/posts</code> to create, <code>PATCH /v1/users/42</code> to update a bio, <code>DELETE /v1/posts/99</code> to remove. Notice the pattern: nouns for resources, methods for actions, plural collections, a version up front.",
      "Compare the messy non-REST version: <code>/getUserFeed</code>, <code>/createPostAction</code> &mdash; verbs jammed into URLs, no method semantics, inconsistent naming. The first style any iOS dev can read at a glance; the second needs a manual."
    ],
    interview:[
      "You design a REST contract in almost every high-level design. Senior signal: <em>I would model resources as nouns with consistent, plural, hierarchical URLs, use HTTP methods and status codes properly, keep it stateless with token auth, return JSON, and add pagination and versioning from day one</em>.",
      "Tradeoff to name: REST returns fixed response shapes, so it can <strong>over-fetch</strong> (too much data) or <strong>under-fetch</strong> (forcing several round trips) &mdash; painful on mobile. That gap is exactly what GraphQL and a Backend-for-Frontend (Steps 019, 117) exist to close."
    ],
    resources:[
      {label:"Stack Overflow Blog — Best practices for REST API design", url:"https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/", note:"Practical, widely-cited guide"},
      {label:"Microsoft Azure — Web API design best practices", url:"https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design", note:"Thorough principles reference"},
      {label:"Vinay Sahni — Pragmatic RESTful API", url:"https://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api", note:"The classic pragmatic checklist"},
      {label:"YouTube — search: REST API design explained", url:"https://www.youtube.com/results?search_query=rest+api+design+best+practices", note:"Reliable: ByteByteGo, Web Dev Simplified"}
    ],
    oneliner:"REST models your API as resources (nouns) at clean URLs, acted on by HTTP methods, stateless, returning JSON with proper status codes — predictable by design; its weakness is fixed shapes (over/under-fetching)."
  },

  16: {
    concept:[
      "Your app speaks Swift (structs and types); the server speaks <strong>JSON</strong> (text). They need a translator at the border. On the way out you pack a Swift object into a JSON suitcase (<strong>encoding</strong>, a.k.a. <strong>serialization</strong>); on the way in you unpack the JSON suitcase back into a Swift object (<strong>decoding</strong>, a.k.a. <strong>deserialization</strong>). In Swift, that translator is <strong>Codable</strong>.",
      "You mark a type <code>Codable</code> (which is just <strong>Encodable &amp; Decodable</strong>) and the compiler synthesizes the translation for you; <strong>JSONDecoder</strong> and <strong>JSONEncoder</strong> do the actual work. Because it is generated at compile time (no runtime reflection), it is type-safe and fast.",
      "The everyday wrinkle: JSON often uses <strong>snake_case</strong> (<code>created_at</code>) while Swift prefers <strong>camelCase</strong> (<code>createdAt</code>). You bridge that with a <strong>CodingKeys</strong> enum (map each property to its JSON key) or by setting <code>decoder.keyDecodingStrategy = .convertFromSnakeCase</code>. Fields that may be absent should be <code>Optional</code>, and dates get a date-decoding strategy."
    ],
    why:[
      "This is the daily bread of an iOS networking layer: every response you read and every body you send passes through it. Codable kills the fragile, hand-written parsing of the old days and makes the whole thing type-safe.",
      "It is also the bridge between the <strong>API contract</strong> (Step 015) and your app&rsquo;s models &mdash; and the place where real-world crashes hide. Get the handling of missing fields, nulls, snake_case, and dates wrong and a single unexpected value can fail the entire parse."
    ],
    example:[
      "Decoding a feed: define <code>struct Post: Codable { let id: Int; let authorName: String }</code> with a <code>CodingKeys</code> entry mapping <code>authorName</code> to <code>author_name</code>, then call <code>try JSONDecoder().decode([Post].self, from: data)</code>.",
      "A classic real bug: a non-optional property like <code>authorName</code> suddenly arrives as <code>null</code> from the server &mdash; decoding throws, and your whole screen goes blank. The fix is defensive modelling: make genuinely-optional fields <code>Optional</code>, so one bad field does not sink the entire response."
    ],
    interview:[
      "This is more an implementation (LLD) detail than a system-design topic, but it surfaces when you design the network/data layer or discuss resilience. Senior signal: <em>models are Codable, decoded with convertFromSnakeCase; I keep network DTOs separate from domain models so an API change does not ripple into the UI, and I model uncertain fields as optional so one bad value does not break the response</em>.",
      "Tradeoff: strict decoding (fail fast, surfaces server bugs) vs lenient decoding (defaults/optionals, keeps the app working) &mdash; shipping apps usually lean lenient because the server will change under you."
    ],
    resources:[
      {label:"Hacking with Swift — Codable cheat sheet", url:"https://www.hackingwithswift.com/articles/119/codable-cheat-sheet", note:"The go-to practical iOS reference"},
      {label:"Donny Wals — Customizing how Codable maps to JSON", url:"https://www.donnywals.com/customizing-how-codable-objects-map-to-json-data/", note:"CodingKeys and key strategies in depth"},
      {label:"Apple — JSONDecoder", url:"https://developer.apple.com/documentation/foundation/jsondecoder", note:"Official API + decoding strategies"},
      {label:"YouTube — search: Swift Codable JSON tutorial", url:"https://www.youtube.com/results?search_query=swift+codable+json+tutorial", note:"Reliable: CodeWithChris, Sean Allen"}
    ],
    oneliner:"Codable is Swift's translator between your types and JSON — encode to send, decode to receive; map snake_case with CodingKeys, model uncertain fields as Optional so one bad value doesn't break the whole parse."
  },

  17: {
    concept:[
      "Imagine you publish a popular board game. Rulebooks are now in homes all over the world. One day you want to change a rule &mdash; but you cannot teleport into everyone&rsquo;s house and edit their copy. If you just change it, players mid-game get confused. So you release a clearly labelled &lsquo;Edition 2&rsquo; and let people keep playing Edition 1 until they choose to upgrade. <strong>API versioning</strong> is exactly that.",
      "Once apps in the wild depend on your API, you cannot simply change it &mdash; you ship a new version and keep the old one working, so you can evolve without a <strong>breaking change</strong>. Common strategies: <strong>URI versioning</strong> (<code>/v1/users</code> &mdash; most common, visible, easy to test), <strong>header versioning</strong> (a custom header or <code>Accept: application/vnd.example.v2+json</code> &mdash; keeps URLs clean; used by Stripe and GitHub), and <strong>query-param versioning</strong> (<code>?version=2</code>).",
      "Pair it with <strong>semantic versioning</strong> (<code>MAJOR.MINOR.PATCH</code>, where a major bump signals breaking changes) and a clear <strong>deprecation policy</strong>: announce, give months of notice, then retire the old version."
    ],
    why:[
      "This matters uniquely on <strong>mobile</strong>. A website deploys once and everyone instantly runs the new code &mdash; but mobile apps are <em>installed copies frozen in the wild</em>. Users go months or years without updating, so old app versions keep calling your API. If the backend changes without versioning, those un-updated apps break.",
      "So versioning and <strong>backward compatibility</strong> are how you add features without bricking old installs &mdash; and how teams ship v2 for new clients while v1 keeps the old ones alive. This connects directly to backward compatibility and deprecation (Step 112)."
    ],
    example:[
      "Your feed lives at <code>GET /v1/feed</code> and you want to change its response shape. Editing v1 would crash everyone still on the old app (their decoder expects the old shape). So you ship <code>GET /v2/feed</code> and point the new app release at it; old apps keep hitting v1. Once almost nobody uses v1, you announce deprecation and retire it.",
      "The cautionary tale: a backend team makes a &lsquo;small&rsquo; un-versioned change, and suddenly users on a six-month-old build see blank screens or crashes because their frozen app cannot parse the new response. This is also why apps build in a <strong>force-update</strong> path."
    ],
    interview:[
      "High-value precisely because it is a mobile-specific trap. Senior signal: <em>because old app versions live in the wild for months, the API must be versioned and backward compatible; I would use URI versioning from day one, prefer additive non-breaking changes, and keep a deprecation policy plus a client force-update path for unavoidable breaking changes</em>.",
      "Tradeoff: every live version is more to maintain and test, so favour <strong>additive, backward-compatible changes</strong> (new optional fields) over spinning up a whole new version whenever you can."
    ],
    resources:[
      {label:"DigitalAPI — REST API Versioning (definition, strategies, when to use)", url:"https://www.digitalapi.ai/blogs/rest-versioning-definition-best-practices-pros-cons-and-when-to-use", note:"Compares all the strategies"},
      {label:"xMatters — API Versioning strategies & best practices", url:"https://www.xmatters.com/blog/api-versioning-strategies", note:"Pros/cons of each approach"},
      {label:"API7 — Versioning in APIs (with real company examples)", url:"https://api7.ai/learning-center/api-101/api-versioning", note:"How Stripe / GitHub / Twitter version"},
      {label:"YouTube — search: API versioning strategies", url:"https://www.youtube.com/results?search_query=api+versioning+strategies+explained", note:"Reliable: ByteByteGo"}
    ],
    oneliner:"Versioning lets your API evolve without breaking installed apps frozen in the wild — use /v1/ from day one, prefer additive backward-compatible changes, and deprecate old versions with notice plus a force-update path."
  },

  18: {
    concept:[
      "Imagine pulling up to a drive-through and the speaker just barks &lsquo;no&rsquo;. No reason, no alternative &mdash; useless. A good drive-through says &lsquo;we are out of fries, want onion rings instead?&rsquo;: a clear status, a human reason, and a hint about what to do next. Designing <strong>API error responses</strong> is making your server the helpful drive-through, not the &lsquo;no&rsquo; one.",
      "When something goes wrong, a well-designed API returns two things: the right <strong>HTTP status code</strong> (the category &mdash; 4xx your fault, 5xx mine, from Step 013) <em>and</em> a consistent, structured error <strong>body</strong> in JSON. That body carries a stable <strong>machine-readable error code</strong>, a <strong>human-readable message</strong>, optional <strong>field-level details</strong>, and a <strong>request/trace id</strong> for debugging.",
      "Consistency is everything: every error across the whole API should share the same shape, so the client handles them uniformly. There is even a standard for it &mdash; <strong>RFC 9457 &lsquo;Problem Details&rsquo;</strong> (<code>application/problem+json</code>)."
    ],
    why:[
      "Because the connection is stateless and remote, the error response is <em>all</em> the client has to work out what happened and what to do. A stable error <strong>code</strong> lets the app react programmatically &mdash; <code>card_declined</code> opens a specific screen &mdash; instead of fragile string-matching on the message. A <strong>request id</strong> lets you find that exact failure in the server logs.",
      "And you must never <strong>leak internals</strong> (stack traces, SQL) in the response &mdash; that is both a security risk and noise for the client. Keep gory detail in your logs; expose only safe, stable codes and messages."
    ],
    example:[
      "Your app calls <code>POST /payments</code> and gets <code>402</code> with body <code>{ &quot;code&quot;: &quot;card_declined&quot;, &quot;message&quot;: &quot;Your card was declined.&quot;, &quot;request_id&quot;: &quot;req_abc123&quot; }</code>. The networking layer maps <code>card_declined</code> to a specific screen and logs the <code>request_id</code> for support.",
      "A signup validation failure returns <code>400</code> with field-level detail like <code>{ &quot;errors&quot;: [{ &quot;field&quot;: &quot;email&quot;, &quot;code&quot;: &quot;invalid_format&quot; }] }</code>, so the app highlights the right field. Contrast the anti-pattern: returning <code>200</code> with <code>{ &quot;success&quot;: false }</code>, which forces the app to special-case every response and quietly breaks retries and monitoring."
    ],
    interview:[
      "Comes up in API design. Senior signal: <em>I would return correct status codes plus a consistent error envelope &mdash; a stable machine-readable code, a message, and a request id; the client switches on the code, shows friendly messages, retries 5xx and 429 with backoff, and never parses message strings</em>. Mention field-level validation errors and not leaking internals.",
      "Tradeoff: rich error detail helps clients and debugging but can leak sensitive info &mdash; expose only safe, stable codes and messages, and keep the rest server-side."
    ],
    resources:[
      {label:"Postman — Best practices for API error handling", url:"https://blog.postman.com/best-practices-for-api-error-handling/", note:"Standard error fields and patterns"},
      {label:"Speakeasy — Errors in REST API design (RFC 9457)", url:"https://www.speakeasy.com/api-design/errors", note:"The modern Problem Details standard"},
      {label:"Baeldung — REST API Error Handling Best Practices", url:"https://www.baeldung.com/rest-api-error-handling-best-practices", note:"Status-code mapping done right"},
      {label:"YouTube — search: REST API error handling design", url:"https://www.youtube.com/results?search_query=rest+api+error+handling+design", note:"Reliable: ByteByteGo"}
    ],
    oneliner:"Good API errors return the right status code plus a consistent JSON body with a stable machine-readable code, a human message, and a request id — so the client reacts programmatically; never hide errors in a 200 or leak internals."
  },

  19: {
    concept:[
      "REST is a fixed-menu restaurant: you order dish #5 and get exactly what is on the plate &mdash; including the garnish you did not want &mdash; and if you also want a side from another menu, you place a second order. <strong>GraphQL</strong> is build-your-own-bowl: you tell the kitchen the exact ingredients you want, no more and no less, in a single order, even pulling from what would have been several menus.",
      "GraphQL is a <strong>query language for APIs</strong> (from Facebook, open-sourced 2015) with a <strong>single endpoint</strong>. The client sends a <strong>query</strong> naming exactly the fields it wants &mdash; across related resources &mdash; and the server returns precisely that shape in <strong>one round trip</strong>. It is backed by a <strong>strongly typed schema</strong> (types like User and Post and their relationships). Reads are <strong>queries</strong>, writes are <strong>mutations</strong>, and live updates are <strong>subscriptions</strong>.",
      "It exists to kill REST&rsquo;s two classic pains: <strong>over-fetching</strong> (getting more data than you need) and <strong>under-fetching</strong> (having to call several endpoints to build one screen)."
    ],
    why:[
      "It was literally designed for <strong>mobile</strong>: limited networks, lots of screen variations, and the pain of REST forcing either bloated payloads or multiple round trips. With GraphQL a complex screen &mdash; user + their posts + comment counts &mdash; becomes a single request returning exactly the fields the screen needs. Fewer round trips and smaller payloads is the latency win mobile cares about (Step 005).",
      "The cost: complexity moves to the server (schema + <strong>resolvers</strong>), and caching is harder &mdash; there is no simple per-URL HTTP cache because everything is one endpoint &mdash; so you lean on client libraries like <strong>Apollo</strong> or Relay."
    ],
    example:[
      "A profile screen needs the user&rsquo;s name, avatar, last 3 posts, and each post&rsquo;s like count. In REST that is often three round trips (<code>/users/42</code>, then <code>/users/42/posts?limit=3</code>, then a like count) plus extra fields you ignore.",
      "In GraphQL it is one query &mdash; <code>{ user(id:42){ name avatar posts(last:3){ title likeCount } } }</code> &mdash; and the response JSON mirrors that exact shape. On iOS you would typically use the <strong>Apollo iOS</strong> client, which generates Swift types from the schema."
    ],
    interview:[
      "Raise it when REST&rsquo;s over/under-fetching genuinely hurts, or for apps with many screen variants or multiple client types. Senior signal: <em>GraphQL lets each screen fetch exactly the fields it needs in one round trip, avoiding over/under-fetching; the cost is server complexity and harder caching, handled client-side by Apollo/Relay</em>. Do not oversell &mdash; plenty of systems are perfectly happy on REST.",
      "Tradeoff: flexibility vs caching and complexity; also an unguarded GraphQL endpoint lets clients craft very expensive nested queries, so you need depth and complexity limits."
    ],
    resources:[
      {label:"How to GraphQL — GraphQL is the better REST", url:"https://www.howtographql.com/basics/1-graphql-is-the-better-rest/", note:"Clearest intro to over/under-fetching"},
      {label:"IBM — GraphQL vs REST", url:"https://www.ibm.com/think/topics/graphql-vs-rest-api", note:"Balanced comparison"},
      {label:"Apollo iOS — official docs", url:"https://www.apollographql.com/docs/ios/", note:"The standard GraphQL client for iOS"},
      {label:"YouTube — search: GraphQL explained", url:"https://www.youtube.com/results?search_query=graphql+explained+vs+rest", note:"Reliable: Fireship, ByteByteGo"}
    ],
    oneliner:"GraphQL is a single-endpoint query language where the client asks for exactly the fields it needs in one round trip — killing REST's over/under-fetching (great for mobile), at the cost of server complexity and harder caching."
  },

  20: {
    concept:[
      "REST with JSON is like mailing a handwritten letter: human-readable, works everywhere, but bulky and slowish to write and read. <strong>gRPC with Protocol Buffers</strong> is like sending a tightly-zipped, pre-agreed binary form: tiny and lightning-fast to pack and unpack &mdash; but both sides need the same template to read it. You trade human-readability for raw speed.",
      "<strong>gRPC</strong> is a high-performance <strong>RPC (Remote Procedure Call)</strong> framework from Google that lets one service call another as if calling a local function. It serializes data with <strong>Protocol Buffers (protobuf)</strong> &mdash; a compact <strong>binary</strong> format defined in a <code>.proto</code> schema &mdash; and runs over <strong>HTTP/2</strong> (multiplexing, header compression, persistent connections). From the <code>.proto</code> file it generates strongly-typed client and server code in many languages.",
      "Its superpowers: small binary payloads (far lighter than JSON), a strong typed <strong>contract</strong> (the <code>.proto</code> is the source of truth), and native <strong>streaming</strong> &mdash; server-side, client-side, and bidirectional &mdash; over a single connection."
    ],
    why:[
      "It shines for <strong>service-to-service</strong> communication inside the backend (microservices): high throughput, low latency, compact payloads, and contracts that catch mismatches at compile time. Google, Netflix and friends use it heavily between internal services.",
      "It is usually <em>not</em> used directly between a mobile app and the backend, because browsers and mobile have limited native gRPC support (you need gRPC-Web or extra tooling) and REST/JSON is simpler and debuggable for clients. The exception is high-frequency or streaming features, where gRPC&rsquo;s small payloads and bidirectional streaming beat repeated REST calls."
    ],
    example:[
      "Inside a big backend, services talk to each other over gRPC for speed. On the client side, an app might reach for gRPC for a streaming feature &mdash; live location, real-time prices &mdash; where bidirectional streaming and tiny payloads win. You define a <code>.proto</code>, generate Swift code, and call the methods like normal functions.",
      "But for an everyday CRUD feed, REST/JSON is usually the pragmatic pick: anyone can read it, <code>curl</code> it, and debug it in seconds &mdash; whereas a protobuf payload is opaque binary you cannot eyeball."
    ],
    interview:[
      "Mention it when discussing API-style options, backend service communication, or efficiency/streaming needs. Senior signal: <em>between backend microservices I would lean gRPC with protobuf over HTTP/2 for compact, strongly-typed, low-latency calls and streaming; for the mobile client I would usually keep REST/JSON for simplicity and debuggability, reaching for gRPC or protobuf only when we need streaming or very tight payloads</em>.",
      "Tradeoff: performance, strong contracts, and streaming vs human-readability, easy debugging, and broad client/browser support."
    ],
    resources:[
      {label:"gRPC — Introduction (official)", url:"https://grpc.io/docs/what-is-grpc/introduction/", note:"What gRPC is, from the source"},
      {label:"Protocol Buffers — overview (official)", url:"https://protobuf.dev/overview/", note:"The .proto schema and binary format"},
      {label:"IBM — gRPC vs REST", url:"https://www.ibm.com/think/topics/grpc-vs-rest", note:"When to choose which, with streaming types"},
      {label:"YouTube — search: gRPC explained protocol buffers", url:"https://www.youtube.com/results?search_query=grpc+explained+protocol+buffers", note:"Reliable: ByteByteGo, Fireship"}
    ],
    oneliner:"gRPC is a fast RPC framework using compact binary Protocol Buffers over HTTP/2 with strong contracts and streaming — great between backend microservices; mobile clients usually keep REST/JSON for simplicity unless they need streaming or tiny payloads."
  },

  21: {
    concept:[
      "Imagine reading a 10,000-page book. You do not carry the whole thing around &mdash; you read a chunk, slip in a bookmark, and pick up there next time. <strong>Pagination</strong> is fetching a big list in small chunks (pages) instead of all at once. The interesting question is <em>how</em> you remember your place: by page number (<strong>offset</strong>) or by bookmark (<strong>cursor</strong>).",
      "<strong>Offset pagination</strong> says &lsquo;skip 40, give me 20&rsquo;: the client sends an <strong>offset</strong> (how many to skip) and a <strong>limit</strong> (page size), or just a page number. It maps to SQL <code>LIMIT/OFFSET</code>. It is simple, lets you jump to any page, and can show &lsquo;page 3 of 771&rsquo; with a total count.",
      "<strong>Cursor pagination</strong> (a.k.a. <strong>keyset</strong>) hands back an opaque <strong>cursor</strong> instead &mdash; a bookmark pointing at the last item you saw (usually a Base64-encoded id + sort key). The next request sends that cursor and the server returns items <em>after</em> it. This is what Stripe, Slack, GitHub, and most social feeds use."
    ],
    why:[
      "Pagination protects everyone: never ship a million rows &mdash; it crushes the database, blows up mobile memory, and wastes bandwidth. Small pages keep responses fast.",
      "The offset-vs-cursor choice is the real lesson. <strong>Offset</strong> is simple and allows random page jumps and totals, but it has two flaws: it gets <strong>slow at deep pages</strong> (the database must count and skip every preceding row &mdash; page 5,000 is unusable), and it is <strong>inconsistent on changing data</strong> (insert a new item while someone pages and they get duplicates or skips). <strong>Cursor</strong> stays fast at <em>any</em> depth and is stable when new items arrive &mdash; a bookmark to a specific row does not shift &mdash; but it gives up random page access and easy totals. For mobile feeds, which are infinite-scroll and constantly changing, cursor wins almost every time."
    ],
    example:[
      "Your infinite-scroll feed: first call <code>GET /feed?limit=20</code> returns 20 posts plus a <code>next_cursor</code>. As the user nears the bottom you call <code>GET /feed?limit=20&amp;cursor=&lt;next_cursor&gt;</code> and append the next page.",
      "Because it is cursor-based, even if 5 new posts are published while the user scrolls, they see no duplicates or skips. With offset (<code>?offset=20</code>), a single new post inserted at the top shifts everything down and the user sees post #20 twice &mdash; the classic &lsquo;why is this post showing twice in my feed?&rsquo; bug."
    ],
    interview:[
      "Pagination shows up in nearly every list or feed design. Senior signal: <em>for an infinite-scroll feed I would use cursor-based pagination because it stays fast at any depth and stays consistent as new items arrive; offset is fine only for small, static, page-numbered lists like settings or admin tables</em>. Name both the deep-page slowness and the duplicate/skip problem of offset on changing data.",
      "Tradeoff: cursor = consistent and fast but no random access or total count; offset = simple with page jumps but slow deep and unstable on live data."
    ],
    resources:[
      {label:"Gusto — A Developer's Guide to API Pagination (offset vs cursor)", url:"https://embedded.gusto.com/blog/api-pagination/", note:"Clear, with the real-world scaling story"},
      {label:"Milan Jovanović — Cursor pagination deep dive", url:"https://www.milanjovanovic.tech/blog/understanding-cursor-pagination-and-why-its-so-fast-deep-dive", note:"Why cursor stays fast (with benchmarks)"},
      {label:"Better Programming — Offset and Cursor pagination", url:"https://betterprogramming.pub/understanding-the-offset-and-cursor-pagination-8ddc54d10d98", note:"Side-by-side mechanics"},
      {label:"YouTube — search: cursor vs offset pagination", url:"https://www.youtube.com/results?search_query=cursor+vs+offset+pagination", note:"Reliable: ByteByteGo"}
    ],
    oneliner:"Pagination fetches a big list in chunks; offset (skip N) is simple with page jumps but slow-deep and unstable on live data, while cursor (a bookmark to the last item) stays fast and consistent — the right pick for infinite-scroll feeds."
  },

  22: {
    concept:[
      "Think of a hotel key card. You would never hand a guest your master key (your password). Instead the front desk (the <strong>authorization server</strong>) issues a temporary key card (an <strong>access token</strong>) that opens only specific doors (<strong>scopes</strong>) for a limited time, and can be revoked. <strong>OAuth 2.0</strong> is that system for apps: it lets an app get <strong>limited, delegated access</strong> to your account on another service <em>without ever seeing your password</em>.",
      "Every &lsquo;Sign in with Google/Apple&rsquo; button is OAuth in action &mdash; the app never learns your Google password; Google just hands it a token. Four roles are involved: the <strong>resource owner</strong> (you), the <strong>client</strong> (the app), the <strong>authorization server</strong> (issues tokens), and the <strong>resource server</strong> (holds the data, checks the token).",
      "The recommended flow for apps is the <strong>Authorization Code flow with PKCE</strong>: the app sends you to the auth server &rarr; you log in and approve scopes &rarr; it returns a short-lived <strong>authorization code</strong> &rarr; the app exchanges the code (plus a <strong>PKCE</strong> proof) for an <strong>access token</strong> and usually a <strong>refresh token</strong> &rarr; the app calls the API with the access token. One precise nuance: OAuth is <strong>authorization</strong> (&lsquo;what can this app access?&rsquo;), not authentication; <strong>OpenID Connect (OIDC)</strong> is built on top to add &lsquo;who is this user?&rsquo; via an id_token."
    ],
    why:[
      "It solves &lsquo;never give your password to third parties&rsquo; and enables access that is <strong>delegated, scoped, and revocable</strong>. Scopes mean an app gets only what it needs; tokens expire and can be revoked, limiting the blast radius if one leaks. It is the backbone of every &lsquo;Sign in with X&rsquo; and any app acting on another service&rsquo;s data on your behalf.",
      "For mobile, Authorization Code + <strong>PKCE</strong> is the standard because native apps are <em>public clients</em> that cannot safely keep a secret &mdash; PKCE stops an attacker who intercepts the authorization code from redeeming it."
    ],
    example:[
      "&lsquo;Sign in with Google&rsquo; in your app: tapping it opens a secure <code>ASWebAuthenticationSession</code> to Google; the user approves; your app receives an authorization code and exchanges it (with PKCE) for an access token + refresh token; you store them in the <strong>Keychain</strong> and attach the access token as a <code>Bearer</code> header on API calls.",
      "When the access token expires, you use the refresh token to get a new one silently &mdash; no re-login. Apple&rsquo;s Sign in with Apple and the <code>AuthenticationServices</code> framework are the iOS-native pieces."
    ],
    interview:[
      "Comes up in any auth design. Senior signal: <em>for login I would use OAuth 2.0 Authorization Code flow with PKCE (the standard for native apps), store tokens in the Keychain, send the access token as a Bearer header, and use the refresh token for silent renewal &mdash; and note OAuth is authorization while OIDC adds authentication</em>. Connects to tokens (Step 023), token storage (Step 025), and statelessness (Step 006).",
      "Tradeoff/nuance: never use the deprecated implicit flow; PKCE is mandatory on mobile. The tricky parts are secure token storage and refresh-token handling."
    ],
    resources:[
      {label:"Authgear — How OAuth 2.0 works (hotel key-card analogy)", url:"https://www.authgear.com/post/what-is-oauth-2-0-and-how-it-works/", note:"Clearest beginner walkthrough"},
      {label:"OAuth.net — OAuth 2.0 (official)", url:"https://oauth.net/2/", note:"The authoritative spec hub"},
      {label:"Apple — Authentication Services (Sign in with Apple)", url:"https://developer.apple.com/documentation/authenticationservices", note:"The iOS-native login pieces"},
      {label:"YouTube — search: OAuth 2.0 explained", url:"https://www.youtube.com/results?search_query=oauth+2.0+explained", note:"Reliable: OktaDev, ByteByteGo"}
    ],
    oneliner:"OAuth 2.0 is a hotel-key-card system: an app gets a scoped, expiring, revocable access token to act on your behalf without your password — use Authorization Code + PKCE on mobile; OAuth is authorization, OIDC adds authentication."
  },

  23: {
    concept:[
      "Picture a library membership card with an official seal. Instead of the librarian keeping a notebook of every visitor (a server-side session), she hands you a card showing your name and status, stamped with a tamper-proof seal. Each visit you flash the card and she just checks the seal &mdash; no notebook needed. A <strong>JWT</strong> is that card: a self-contained, signed token the server can trust <em>without</em> storing any session.",
      "A <strong>JWT (JSON Web Token)</strong> is a compact string in three dot-separated parts: <code>header.payload.signature</code>. The <strong>header</strong> names the token type and signing algorithm (e.g. HS256, RS256). The <strong>payload</strong> holds the <strong>claims</strong> &mdash; data like user id and role, plus standard ones like <code>exp</code> (expiry), <code>iss</code> (issuer), <code>sub</code> (subject). The <strong>signature</strong> is the header+payload signed with a secret or private key, proving authenticity and integrity.",
      "The crucial catch: the payload is only <strong>Base64Url-encoded, not encrypted</strong> &mdash; anyone can decode and read it (try it on jwt.io). So never put secrets in it. Its power is the <strong>signature</strong>: tamper with the payload (say, change <code>&quot;role&quot;:&quot;user&quot;</code> to <code>&quot;role&quot;:&quot;admin&quot;</code>) and the signature no longer matches, so the server rejects it. The server trusts the signature, never the raw payload."
    ],
    why:[
      "JWTs enable <strong>stateless authentication</strong> (Step 006): the token itself carries the user&rsquo;s identity and is self-verifiable via its signature, so the server does not look up a session in a database on every request &mdash; <em>any</em> server can validate it independently. That is exactly what lets the backend scale horizontally behind a load balancer, and it is typically the access-token format inside OAuth 2.0 / OIDC (Step 022).",
      "The tradeoff to know: because it is stateless, a JWT is <strong>hard to revoke</strong> before it expires (there is no session to delete). The standard mitigation is to keep access tokens <strong>short-lived</strong> and lean on refresh tokens, with a denylist only for emergencies."
    ],
    example:[
      "After login your backend issues a JWT access token. The app stores it in the <strong>Keychain</strong> and sends it as <code>Authorization: Bearer &lt;jwt&gt;</code> on every request (the stateless pattern). The backend verifies the signature and reads the claims &mdash; user id, role, <code>exp</code> &mdash; with no DB lookup.",
      "You <em>can</em> decode the payload on-device to read the user id or expiry, but you never trust it for security; only the server&rsquo;s signature check counts. The attack it blocks: a user editing their token to grant themselves <code>&quot;role&quot;:&quot;admin&quot;</code> &mdash; the tampered token fails verification and is refused."
    ],
    interview:[
      "Comes up with auth and statelessness. Senior signal: <em>I would use a short-lived signed JWT as the access token so any server can verify identity statelessly without a session lookup; store it in the Keychain, send it as a Bearer header, and keep it short-lived with refresh tokens because JWTs are hard to revoke mid-life</em>. Note the payload is readable, so no secrets inside.",
      "Tradeoff: stateless and scalable vs hard to revoke &mdash; short expiry plus refresh tokens is the standard answer."
    ],
    resources:[
      {label:"jwt.io — Introduction (with live debugger)", url:"https://www.jwt.io/introduction", note:"Decode a real token to see the 3 parts"},
      {label:"Auth0 — JSON Web Token structure", url:"https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-structure", note:"Header / payload / signature in detail"},
      {label:"GeeksforGeeks — JSON Web Token (JWT)", url:"https://www.geeksforgeeks.org/web-tech/json-web-token-jwt/", note:"Concise reference + claims"},
      {label:"YouTube — search: JWT explained", url:"https://www.youtube.com/results?search_query=jwt+json+web+token+explained", note:"Reliable: ByteByteGo, Web Dev Simplified"}
    ],
    oneliner:"A JWT is a signed, self-contained header.payload.signature token carrying the user's claims — any server verifies the signature statelessly (no session lookup); the payload is readable not encrypted, and it's hard to revoke, so keep it short-lived with refresh tokens."
  },

  24: {
    concept:[
      "Picture arriving at a theme park. You get two things: a <strong>day wristband</strong> that gets scanned at every ride, and a <strong>membership card</strong> you keep safe in your bag and only show at the front office to get a fresh wristband when today&rsquo;s expires. The wristband is flashed constantly and wears out fast on purpose; the card is precious, rarely shown, and can be cancelled if lost. That is exactly the <strong>access token</strong> and <strong>refresh token</strong>.",
      "An <strong>access token</strong> is <strong>short-lived</strong> (often ~15 minutes), sent on <em>every</em> API request to prove access, and usually a JWT (Step 023). A <strong>refresh token</strong> is <strong>long-lived</strong> and is <em>never</em> sent to ordinary APIs &mdash; only to the auth server&rsquo;s special <strong>refresh endpoint</strong> &mdash; to mint a new access token without making the user log in again.",
      "Modern systems add <strong>refresh token rotation</strong>: each time a refresh token is used, the server issues a brand-new one and invalidates the old. So if a stolen token gets used, the real client&rsquo;s next refresh fails &mdash; which is how the system <em>detects</em> the theft."
    ],
    why:[
      "The access token is flashed everywhere, so it must be cheap to lose &mdash; hence the short expiry, which keeps the <strong>blast radius</strong> of a leak tiny. But nobody wants to log in every 15 minutes, so the refresh token quietly renews access in the background. Refresh tokens are <strong>stored and revocable</strong> (logout or a breach can kill them); short-lived, signature-verified access tokens often are not stored server-side at all.",
      "For mobile this is the flow right after OAuth login (Step 022): the app holds both tokens in the <strong>Keychain</strong> (Step 025), sends the access token as a <code>Bearer</code> header, and silently refreshes when it expires."
    ],
    example:[
      "Login returns an access token (15 min) + a refresh token (30 days). Your networking layer attaches the access token to every request. A call comes back <code>401</code> (expired), so the app calls <code>POST /auth/refresh</code> with the refresh token, gets a new access token (and, with rotation, a new refresh token), and retries the original request &mdash; all invisible to the user. On logout it tells the server to revoke the refresh token and deletes both from the Keychain.",
      "A classic bug: ten requests hit <code>401</code> at once and all fire a refresh simultaneously. The fix is a <strong>single in-flight refresh</strong> that the other calls await."
    ],
    interview:[
      "Comes up in auth and session design. Senior signal: <em>short-lived access token on every request, long-lived refresh token used only against the auth server to renew silently; rotate refresh tokens to detect theft, store them securely and keep them revocable for logout, and collapse concurrent refreshes into one in-flight call</em>.",
      "Tradeoff: a longer access-token lifetime means fewer refreshes but a bigger window if stolen; rotation adds safety but needs a small <strong>grace period</strong> so a flaky network does not lock out a legitimate client mid-rotation."
    ],
    resources:[
      {label:"LoginRadius — Refresh token rotation explained", url:"https://www.loginradius.com/blog/identity/secure-refresh-token-rotation", note:"Why rotation detects theft"},
      {label:"Descope — Access token vs refresh token", url:"https://www.descope.com/blog/post/access-token-vs-refresh-token", note:"Clear side-by-side breakdown"},
      {label:"Okta — Refresh access tokens & rotate refresh tokens", url:"https://developer.okta.com/docs/guides/refresh-tokens/main/", note:"Practical rotation + grace periods"},
      {label:"YouTube — search: access token vs refresh token", url:"https://www.youtube.com/results?search_query=access+token+vs+refresh+token", note:"Reliable: OktaDev, ByteByteGo"}
    ],
    oneliner:"Access token = short-lived, sent on every request (small blast radius); refresh token = long-lived, sent only to the auth server to silently mint new access tokens — rotate refresh tokens to detect theft, keep them revocable, and single-flight concurrent refreshes."
  },

  25: {
    concept:[
      "You now hold those precious tokens &mdash; where do you keep them? <strong>UserDefaults</strong> is like leaving your house key under the doormat: convenient, but anyone who gets the phone (or a backup) can read it, because UserDefaults is <strong>unencrypted</strong> plain storage. The <strong>Keychain</strong> is the bank vault built into the phone: encrypted, hardware-backed by the <strong>Secure Enclave</strong>, and sandboxed so only your app can read its own items.",
      "The iOS <strong>Keychain</strong> is Apple&rsquo;s encrypted store for small secrets &mdash; passwords, tokens, keys. The rule is simple: <strong>never</strong> put secrets (access/refresh tokens, passwords) in UserDefaults or plain files, which are readable from device backups and inspection tools. Put them in the Keychain.",
      "Mechanics worth knowing: it is a C-based <strong>Security framework</strong> API (<code>SecItemAdd</code> / <code>SecItemCopyMatching</code> / <code>SecItemUpdate</code> / <code>SecItemDelete</code>) operating on dictionaries, so most teams wrap it in a small Swift helper. An item&rsquo;s identity is the <em>combination</em> of attributes (service + account + class), and that whole combo must be unique. You can set an <strong>accessibility</strong> class (e.g. only after first unlock), gate items behind <strong>Face ID / Touch ID</strong>, and share items across your app and its extensions via <strong>access groups</strong>."
    ],
    why:[
      "Tokens are the keys to the user&rsquo;s account; storing them unencrypted is a genuine vulnerability &mdash; jailbroken devices, backups, and forensic tools can read UserDefaults and plain files. The Keychain encrypts at rest and ties access to the device&rsquo;s security, so even a stolen backup does not leak them.",
      "The caveats: the Keychain is <strong>slower than memory</strong> and a bit awkward (C API, <code>OSStatus</code> error codes), so wrap it; it is for <em>small</em> secrets, not large data; items can persist across reinstalls; and changing your bundle id or team can orphan them. For mobile system design, &lsquo;where do the tokens live?&rsquo; is a near-guaranteed question, and the Keychain is the answer."
    ],
    example:[
      "After login you save the refresh token with something like <code>KeychainManager.save(refreshToken, service: &quot;com.app.auth&quot;, account: &quot;refresh&quot;)</code>; on launch you read it back to restore the session; on logout you delete it. For a banking app you would store it with a biometric access control so reading it requires Face ID.",
      "The anti-pattern to call out: <code>UserDefaults.standard.set(token, forKey: &quot;token&quot;)</code> &mdash; it works in a demo, fails a security review, and is trivially extractable from a backup."
    ],
    interview:[
      "Senior signal: <em>secrets like tokens go in the Keychain (encrypted, Secure-Enclave-backed), never UserDefaults; I would wrap the Security API in a small typed helper, choose an appropriate accessibility class, and optionally gate the refresh token behind biometrics &mdash; UserDefaults is only for non-sensitive preferences</em>. Ties to encryption at rest (Step 110) and biometrics (Step 049).",
      "Tradeoff: security vs convenience and speed &mdash; the Keychain is slower and fiddlier than UserDefaults, but it is the correct, non-negotiable home for secrets."
    ],
    resources:[
      {label:"Apple — Keychain Services (official)", url:"https://developer.apple.com/documentation/security/keychain-services", note:"The authoritative API reference"},
      {label:"OneUptime — Keychain secure storage in Swift", url:"https://oneuptime.com/blog/post/2026-02-02-swift-keychain-secure-storage/view", note:"Practical wrapper + best practices"},
      {label:"Donny Wals — Deciding where to store data", url:"https://www.donnywals.com/deciding-where-to-store-data/", note:"When to use Keychain vs other stores"},
      {label:"YouTube — search: iOS Keychain Swift tutorial", url:"https://www.youtube.com/results?search_query=ios+keychain+swift+tutorial", note:"Reliable: Sean Allen, Swiftful Thinking"}
    ],
    oneliner:"Store tokens and secrets in the Keychain — encrypted, Secure-Enclave-backed, sandboxed — never in UserDefaults (plain, readable from backups); wrap the C Security API in a Swift helper, set an accessibility class, and optionally gate behind Face ID."
  },

  26: {
    concept:[
      "Making a network call used to be like ordering food and leaving a note: &lsquo;call me when it is ready&rsquo; &mdash; a <strong>completion handler</strong>. Your logic scattered into callbacks, and nesting several calls became <strong>callback hell</strong>. <strong>async/await</strong> is like simply waiting in line for your order and then carrying on: the code reads top-to-bottom like ordinary synchronous steps, even though it is still asynchronous underneath.",
      "<strong>URLSession</strong> is Apple&rsquo;s built-in networking framework &mdash; no third party needed. Since Swift 5.5 / iOS 15 it has async/await methods. The one-line GET is <code>let (data, response) = try await URLSession.shared.data(from: url)</code>. You then check the status via <code>(response as? HTTPURLResponse)?.statusCode</code> and decode with <strong>JSONDecoder</strong> (Step 016). For POST/PUT you build a <code>URLRequest</code> (set <code>httpMethod</code>, headers, <code>httpBody</code>) and call <code>data(for: request)</code>.",
      "Done properly, you wrap this in a reusable <strong>APIClient / networking layer</strong>: one place that builds requests, attaches the auth <code>Bearer</code> header (Step 024), validates status codes, maps errors (Step 018), and decodes &mdash; so screens just call typed methods like <code>fetchFeed() async throws -&gt; [Post]</code>."
    ],
    why:[
      "Networking is the heartbeat of almost every app, and URLSession is the native, dependency-free way to do it. <strong>async/await</strong> makes that code dramatically cleaner and safer than closures: sequential calls, real <code>try/catch</code> error handling, and natural <strong>cancellation</strong> (cancelling the <code>Task</code> cancels the request).",
      "A reusable networking layer is what keeps the app maintainable &mdash; auth, retries (Step 028), timeouts (Step 029), decoding, and error mapping all live in one place instead of being copy-pasted into every screen. This is the foundation the next several topics build on."
    ],
    example:[
      "A typed call: <code>func fetchFeed() async throws -&gt; [Post] { let (data, response) = try await URLSession.shared.data(from: feedURL); guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw APIError.badStatus }; return try JSONDecoder().decode([Post].self, from: data) }</code>, kicked off from a SwiftUI view with <code>.task { posts = try await fetchFeed() }</code>.",
      "Compare the old closure version &mdash; <code>URLSession.shared.dataTask(with:) { data, response, error in ... }</code> with nested handlers and manual thread hops. async/await collapses all of that into readable straight-line code."
    ],
    interview:[
      "This is more implementation (LLD) than high-level design, but the &lsquo;design a network layer&rsquo; question (Steps 027, 124) builds directly on it. Senior signal: <em>I would build a reusable async APIClient over URLSession that constructs requests, injects auth, validates status codes, maps errors, and decodes via Codable, exposing typed async-throws methods; async/await gives clean sequential code, real error handling, and cancellation</em>.",
      "Tradeoff/nuance: async/await needs iOS 15+ (older targets fall back to closures or Combine); <code>URLSession.shared</code> is fine for simple cases, but a custom <code>URLSession</code> lets you configure timeouts, caching, and default headers."
    ],
    resources:[
      {label:"Apple — URLSession (official)", url:"https://developer.apple.com/documentation/foundation/urlsession", note:"The framework reference"},
      {label:"Antoine van der Lee — URLSession & async/await", url:"https://www.avanderlee.com/concurrency/urlsession-async-await-network-requests-in-swift/", note:"GET/POST, decoding, error handling"},
      {label:"Swift Senpai — async/await network requests", url:"https://swiftsenpai.com/swift/async-await-network-requests/", note:"Closures vs async/await compared"},
      {label:"YouTube — search: URLSession async await Swift", url:"https://www.youtube.com/results?search_query=urlsession+async+await+swift", note:"Reliable: Sean Allen, Swiftful Thinking"}
    ],
    oneliner:"URLSession is Apple's built-in networking; since iOS 15 its async/await API (let (data, response) = try await URLSession.shared.data(from: url)) makes calls read top-to-bottom — wrap it in a reusable typed APIClient that injects auth, checks status, maps errors, and decodes."
  }

};
