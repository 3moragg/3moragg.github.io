let currentUserId = '879299656708915250';
const CdnBaseUrl = 'https://cdn.discordapp.com/';
const IconPaths = {
    desktop: "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z",
    web: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z",
    mobile: "M 6.992 0 L 17.008 0 C 18.66 0 20 1.34 20 2.992 L 20 21.008 C 20 22.66 18.66 24 17.008 24 L 6.992 24 C 5.34 24 4 22.66 4 21.008 L 4 2.992 C 4 1.34 5.34 0 6.992 0 Z M 6 16 L 18 16 L 18 4 L 6 4 Z M 12 18 C 10.895 18 10 18.895 10 20 C 10 21.105 10.895 22 12 22 C 13.105 22 14 21.105 14 20 C 14 18.895 13.105 18 12 18 Z",
    embedded: "M3.06 20.4q-1.53 0-2.37-1.065T.06 16.74l1.26-9q.27-1.8 1.605-2.97T6.06 3.6h11.88q1.8 0 3.135 1.17t1.605 2.97l1.26 9q.21 1.53-.63 2.595T20.94 20.4q-.63 0-1.17-.225T18.78 19.5l-2.7-2.7H7.92l-2.7 2.7q-.45.45-.99.675t-1.17.225Zm14.94-7.2q.51 0 .855-.345T19.2 12q0-.51-.345-.855T18 10.8q-.51 0-.855.345T16.8 12q0 .51.345 .855T18 13.2Zm-2.4-3.6q.51 0 .855-.345T16.8 8.4q0-.51-.345-.855T15.6 7.2q-.51 0-.855.345T14.4 8.4q0 .51.345 .855T15.6 9.6ZM6.9 13.2h1.8v-2.1h2.1v-1.8h-2.1v-2.1h-1.8v2.1h-2.1v1.8h2.1v2.1Z",
    vr: "M8.46 8.64a1 1 0 0 1 1 1c0 .44-.3.8-.72.92l-.11.07c-.08.06-.2.19-.2.41a.99.99 0 0 1-.98.86h-.06a1 1 0 0 1-.94-1.05l.02-.32c.05-1.06.92-1.9 1.99-1.9ZM15.55 5a5.5 5.5 0 0 1 5.15 3.67h.3a2 2 0 0 1 2 2v3.18a2 2 0 0 1-2 1.99h-.2A4.54 4.54 0 0 1 16.55 19a4.45 4.45 0 0 1-3.6-1.83 1.2 1.2 0 0 0-1.9 0 4.44 4.44 0 0 1-3.9 1.82 4.54 4.54 0 0 1-3.94-3.15H3a2 2 0 0 1-2-2v-3.18c0-1.1.9-1.99 2-1.99h.3A5.5 5.5 0 0 1 8.46 5h7.09Zm-7.1 2C6.6 7 5.06 8.5 4.97 10.41l-.02.66v3.18c0 1.43 1.05 2.66 2.34 2.74.85.06 1.63-.32 2.14-1.01a3.2 3.2 0 0 1 2.57-1.3c1 0 1.97.48 2.57 1.3.5.69 1.3 1.08 2.14 1.01 1.3-.08 2.34-1.31 2.34-2.74l-.02-3.84a3.54 3.54 0 0 0-3.49-3.43H8.45Z",
};
let progressInterval;
let currentStatus = '';
let socket = null;
let heartbeatInterval = null;
let activityIntervals = {};
let lastCustomStatus = null;
let lastActivities = [];
let lastSpotifyData = null;
let toastTimeout = null;
let hasEntered = false;

function showErrorToast(message) {
    const toast = document.getElementById('errorToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 1000);
}

async function fetchDcdnData(userId) {
    const DcdnUrl = `https://dcdn.dstn.to/profile/${userId}`;
    const response = await fetch(DcdnUrl);
    if (!response.ok) {
        throw new Error('User not found');
    }
    const data = await response.json();
    if (data.user) {
        updateBanner(data.user, userId);
        updateBadges(data.badges);
        updateNameGradient(data.user);
    } else {
        throw new Error('Invalid user data');
    }
}

function updateBanner(userData, userId) {
    const bannerElement = document.getElementById('profileBanner');
    const bannerGifElement = document.getElementById('profileBannerGif');
    const colorBannerElement = document.getElementById('colorBanner');
    bannerElement.style.display = 'none';
    bannerGifElement.style.display = 'none';
    colorBannerElement.style.display = 'none';
    if (userData.banner) {
        if (userData.banner.startsWith('a_')) {
            const gifUrl = `${CdnBaseUrl}banners/${userId}/${userData.banner}.gif?size=480`;
            bannerGifElement.src = gifUrl;
            bannerGifElement.style.display = 'block';
        } else {
            const pngUrl = `${CdnBaseUrl}banners/${userId}/${userData.banner}.png?size=480`;
            bannerElement.src = pngUrl;
            bannerElement.style.display = 'block';
        }
    } else if (userData.banner_color || userData.accent_color) {
        const color = userData.banner_color || `#${userData.accent_color.toString(16).padStart(6, '0')}`;
        colorBannerElement.style.backgroundColor = color;
        colorBannerElement.style.display = 'block';
    }
}

function updateBadges(badges) {
    const badgesContainer = document.getElementById('badgesContainer');
    badgesContainer.innerHTML = '';
    if (badges && badges.length > 0) {
        badges.forEach(badge => {
            if (badge.icon) {
                const badgeImg = document.createElement('img');
                badgeImg.className = 'badge';
                badgeImg.src = `${CdnBaseUrl}badge-icons/${badge.icon}.png`;
                badgeImg.alt = badge.description || 'Badge';
                badgeImg.title = badge.description || '';
                badgesContainer.appendChild(badgeImg);
            }
        });
    }
}

function updateNameGradient(userData) {
    const styles = userData.display_name_styles;
    const nameElements = ['displayName', 'topName']
        .map((id) => document.getElementById(id))
        .filter(Boolean);
    const rawColors = Array.isArray(styles && styles.colors)
        ? styles.colors.filter((value) => Number.isFinite(value) && value >= 0 && value <= 16777215)
        : [];
    if (rawColors.length < 2) {
        nameElements.forEach((element) => element.classList.remove('grad'));
        return;
    }
    const hexColors = rawColors.map((value) => `#${Math.round(value).toString(16).padStart(6, '0')}`);
    let stops;
    if (hexColors.length <= 3) {
        stops = hexColors.map((hex, index) => `${hex} ${((index / (hexColors.length - 1)) * 100).toFixed(2)}%`);
    } else {
        const step = 100 / hexColors.length;
        const blend = Math.min(14, step * 0.7);
        stops = [`${hexColors[0]} 0%`];
        for (let index = 0; index < hexColors.length - 1; index += 1) {
            const boundary = (index + 1) * step;
            stops.push(`${hexColors[index]} ${(boundary - blend / 2).toFixed(2)}%`);
            stops.push(`${hexColors[index + 1]} ${(boundary + blend / 2).toFixed(2)}%`);
        }
        stops.push(`${hexColors[hexColors.length - 1]} 100%`);
    }
    document.documentElement.style.setProperty('--grad', `linear-gradient(90deg, ${stops.join(', ')})`);
    nameElements.forEach((element) => element.classList.add('grad'));
}

async function fetchLanyardData(userId) {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        if (!response.ok) return;
        const result = await response.json();
        if (!result || !result.success || !result.data) return;
        const userData = result.data;
        await updateProfile(userData);
        updateNameplateBackground(userData);
        updateTagInfo(userData);
        const customStatusChanged = updateCustomStatus(userData.activities);
        const spotifyChanged = updateSpotifyIfChanged(userData);
        if (!customStatusChanged || spotifyChanged || hasOtherActivityChanges(userData.activities)) {
            updateActivities(userData.activities);
        }
    } catch (error) {
        console.error('Failed to fetch Lanyard data:', error);
    }
}

function connectWebSocket(userId) {
    try {
        if (socket) {
            const oldSocket = socket;
            oldSocket.onopen = null;
            oldSocket.onmessage = null;
            oldSocket.onclose = null;
            oldSocket.onerror = null;
            try { oldSocket.close(); } catch (e) {}
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
        socket = new WebSocket('wss://api.lanyard.rest/socket');
        const currentSocket = socket;
        socket.onopen = () => {
            if (socket !== currentSocket) return;
            console.log('WebSocket connected');
            fetchDcdnData(userId).catch(error => {
                console.error('Failed to fetch DCDN data:', error);
            });
        };
        socket.onmessage = event => {
            if (socket !== currentSocket) return;
            const message = JSON.parse(event.data);
            switch(message.op) {
                case 1: handleHello(message, userId); break;
                case 0: handleEvent(message); break;
            }
        };
        socket.onclose = () => {
            if (socket !== currentSocket) return;
            console.log('WebSocket disconnected');
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            setTimeout(() => connectWebSocket(userId), 1000);
        };
        socket.onerror = () => {
            if (socket !== currentSocket) return;
            console.error('WebSocket error');
            setTimeout(() => connectWebSocket(userId), 1000);
        };
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setTimeout(() => connectWebSocket(userId), 1000);
    }
}

function handleHello(message, userId) {
    const interval = message.d.heartbeat_interval;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
    }, interval);
    initializeConnection(userId);
}

function initializeConnection(userId) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
    }
}

async function handleEvent(message) {
    if (['INIT_STATE', 'PRESENCE_UPDATE'].includes(message.t)) {
        const userData = message.d;
        await updateProfile(userData);
        updateNameplateBackground(userData);
        updateTagInfo(userData);
        
        const customStatusChanged = updateCustomStatus(userData.activities);
        
        const spotifyChanged = updateSpotifyIfChanged(userData);
        
        if (!customStatusChanged || spotifyChanged || hasOtherActivityChanges(userData.activities)) {
            updateActivities(userData.activities);
        }
    }
}

function hasOtherActivityChanges(newActivities) {
    const newOtherActivities = newActivities ? newActivities.filter(activity => 
        activity.type !== 4 && activity.name !== 'Spotify'
    ) : [];
    
    const oldOtherActivities = lastActivities.filter(activity => 
        activity.type !== 4 && activity.name !== 'Spotify'
    );
    
    if (newOtherActivities.length !== oldOtherActivities.length) return true;
    
    for (let i = 0; i < newOtherActivities.length; i++) {
        const newActivity = newOtherActivities[i];
        const oldActivity = oldOtherActivities[i];
        
        if (!oldActivity || 
            newActivity.name !== oldActivity.name ||
            newActivity.details !== oldActivity.details ||
            newActivity.state !== oldActivity.state) {
            return true;
        }
    }
    
    return false;
}

function updateSpotifyIfChanged(userData) {
    const currentSpotifyData = userData.listening_to_spotify && userData.spotify ? userData.spotify : null;
    
    const spotifyChanged = JSON.stringify(currentSpotifyData) !== JSON.stringify(lastSpotifyData);
    
    if (spotifyChanged) {
        lastSpotifyData = currentSpotifyData;
        
        if (userData.listening_to_spotify && userData.spotify) {
            updateSpotify(userData.spotify);
        } else {
            const spotifyCard = document.getElementById('spotifyCard');
            spotifyCard.classList.remove('sactive');
            updateContainerLayout();
            if (progressInterval) clearInterval(progressInterval);
        }
    }
    
    return spotifyChanged;
}

async function updateProfile(userData) {
    const discordUser = userData.discord_user;
    const avatarElement = document.getElementById('avatar');
    const avatarGifElement = document.getElementById('avatarGif');
    const avatarDecorationElement = document.getElementById('avatarDecoration');
    avatarElement.style.display = 'none';
    avatarGifElement.style.display = 'none';
    let avatarUrl;
    if (discordUser.avatar && discordUser.avatar.startsWith('a_')) {
        avatarUrl = `${CdnBaseUrl}avatars/${discordUser.id}/${discordUser.avatar}.gif?size=256`;
        avatarGifElement.src = avatarUrl;
        avatarGifElement.style.display = 'block';
    } else if (discordUser.avatar) {
        avatarUrl = `${CdnBaseUrl}avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
        avatarElement.src = avatarUrl;
        avatarElement.style.display = 'block';
    } else {
        avatarUrl = `${CdnBaseUrl}embed/avatars/${discordUser.discriminator % 5}.png`;
        avatarElement.src = avatarUrl;
        avatarElement.style.display = 'block';
    }
    if (discordUser.avatar_decoration_data) {
        avatarDecorationElement.style.display = 'block';
        avatarDecorationElement.src = `${CdnBaseUrl}avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png`;
    } else {
        avatarDecorationElement.style.display = 'none';
        avatarDecorationElement.src = '';
    }
    const displayName = discordUser.global_name || discordUser.username;
    document.getElementById('displayName').textContent = displayName;
    document.getElementById('username').textContent = `@${discordUser.username}`;
    updateStatus(userData.discord_status, userData.activities);
    updateDeviceIcons(userData);
    updateTopBar(userData);

    const bioAvatar = document.getElementById('bioAvatar');
    const bioUsername = document.getElementById('bioUsername');
    if (bioAvatar) bioAvatar.src = avatarUrl;
    if (bioUsername) bioUsername.textContent = displayName;
}

function updateTopBar(userData) {
    const discordUser = userData.discord_user;
    if (!discordUser) return;
    const avatarEl = document.getElementById('topAvatar');
    const nameEl = document.getElementById('topName');
    const displayName = discordUser.global_name || discordUser.username;
    if (nameEl) nameEl.textContent = displayName;
    let avatarUrl;
    if (discordUser.avatar && discordUser.avatar.startsWith('a_')) {
        avatarUrl = `${CdnBaseUrl}avatars/${discordUser.id}/${discordUser.avatar}.gif?size=256`;
    } else if (discordUser.avatar) {
        avatarUrl = `${CdnBaseUrl}avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
    } else {
        avatarUrl = `${CdnBaseUrl}embed/avatars/${discordUser.discriminator % 5}.png`;
    }
    if (avatarEl) avatarEl.src = avatarUrl;
    document.title = displayName;
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = avatarUrl;
}

function updateNameplateBackground(userData) {
    const nameplateData = userData.discord_user?.collectibles?.nameplate;
    const profileHeader = document.getElementById('profileHeader');
    const nameplateVideo = document.getElementById('nameplateVideo');
    if (nameplateData && nameplateData.asset) {
        const videoUrl = `${CdnBaseUrl}assets/collectibles/${nameplateData.asset}asset.webm`;
        nameplateVideo.src = videoUrl;
        nameplateVideo.style.display = 'block';
        profileHeader.style.backgroundColor = 'transparent';
        profileHeader.style.backgroundImage = 'none';
    } else {
        nameplateVideo.src = '';
        nameplateVideo.style.display = 'none';
        profileHeader.style.backgroundColor = 'transparent';
        profileHeader.style.backgroundImage = 'none';
    }
}

function updateTagInfo(userData) {
    const primaryGuild = userData.discord_user?.primary_guild;
    const tagInfoElement = document.getElementById('tagInfo');
    tagInfoElement.innerHTML = '';
    if (primaryGuild && primaryGuild.tag && primaryGuild.badge && primaryGuild.identity_guild_id) {
        const badgeUrl = `${CdnBaseUrl}clan-badges/${primaryGuild.identity_guild_id}/${primaryGuild.badge}.png?size=16`;
        const tagContainer = document.createElement('div');
        tagContainer.className = 'tag';
        const tagImage = document.createElement('img');
        tagImage.className = 'tagic';
        tagImage.src = badgeUrl;
        tagImage.alt = 'Tag Icon';
        const tagText = document.createElement('span');
        tagText.textContent = primaryGuild.tag;
        tagContainer.appendChild(tagImage);
        tagContainer.appendChild(tagText);
        tagInfoElement.appendChild(tagContainer);
    }
}

function updateStatus(status, activities) {
    currentStatus = status;
    const indicator = document.getElementById('statusIndicator');
    indicator.className = 'stat';

    const isStreaming = activities && activities.find(activity =>
        activity.type === 1 && activity.url && (activity.url.includes('twitch.tv') || activity.url.includes('youtube.com'))
    );

    if (isStreaming) {
        indicator.classList.add('sstream');
        return;
    }

    switch(status) {
        case 'dnd': indicator.classList.add('sdnd'); break;
        case 'online': indicator.classList.add('sonline'); break;
        case 'idle': indicator.classList.add('sidle'); break;
        default: indicator.classList.add('soffline');
    }
}

function updateDeviceIcons(userData) {
    const deviceIcons = document.getElementById('deviceIcons');
    deviceIcons.innerHTML = '';
    const devices = [];
    if (userData.active_on_discord_desktop) devices.push('desktop');
    if (userData.active_on_discord_mobile) devices.push('mobile');
    if (userData.active_on_discord_web) devices.push('web');
    if (userData.active_on_discord_embedded) devices.push('embedded');
    if (userData.active_on_discord_vr) devices.push('vr');
    devices.forEach(device => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', `devic ${device} ${currentStatus}`);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'currentColor');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', IconPaths[device]);
        if (device === 'mobile') {
            path.setAttribute('transform', 'translate(2, 2) scale(0.8333)');
            svg.style.marginLeft = '-2px';
            svg.style.marginRight = '-2px';
        }
        svg.appendChild(path);
        deviceIcons.appendChild(svg);
    });
}

function updateSpotify(spotifyData) {
    const spotifyCard = document.getElementById('spotifyCard');
    spotifyCard.classList.add('sactive');
    updateContainerLayout();
    document.getElementById('albumArt').src = spotifyData.album_art_url;
    document.getElementById('trackName').textContent = spotifyData.song;
    document.getElementById('trackArtist').textContent = `by ${spotifyData.artist}`;
    const startTime = spotifyData.timestamps.start;
    const endTime = spotifyData.timestamps.end;
    const duration = endTime - startTime;
    if (progressInterval) clearInterval(progressInterval);
    function updateProgress() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        document.getElementById('progressBar').style.width = `${progress}%`;
        const currentMinutes = Math.floor(elapsed / 60000);
        const currentSeconds = Math.floor((elapsed % 60000) / 1000);
        const totalMinutes = Math.floor(duration / 60000);
        const totalSeconds = Math.floor((duration % 60000) / 1000);
        document.getElementById('currentTime').textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
        document.getElementById('totalTime').textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
        if (progress >= 100) clearInterval(progressInterval);
    }
    updateProgress();
    progressInterval = setInterval(updateProgress, 100);
    const spotifyButtons = document.getElementById('spotifyButtons');
    spotifyButtons.innerHTML = '';
    const spotifyButton = document.createElement('a');
    spotifyButton.className = 'abutton';
    spotifyButton.href = spotifyData.track_id ? `https://open.spotify.com/track/${spotifyData.track_id}` : '#';
    spotifyButton.target = '_blank';
    const spotifyIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spotifyIcon.setAttribute('class', 'btnic sbicon');
    spotifyIcon.setAttribute('viewBox', '0 0 496 512');
    spotifyIcon.setAttribute('fill', 'currentColor');
    const spotifyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    spotifyPath.setAttribute('d', "M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z");
    spotifyIcon.appendChild(spotifyPath);
    spotifyButton.appendChild(spotifyIcon);
    spotifyButton.appendChild(document.createTextNode('Play on Spotify'));
    spotifyButtons.appendChild(spotifyButton);
}

function updateCustomStatus(activities) {
    const customStatusElement = document.getElementById('customStatus');
    const separatorElement = document.getElementById('statusSeparator');
    const usernameElement = document.getElementById('user');
    const customStatus = activities ? activities.find(activity => activity.type === 4) : null;
    
    const currentStatusKey = customStatus ? JSON.stringify({
        emoji: customStatus.emoji,
        state: customStatus.state
    }) : null;
    
    if (currentStatusKey === lastCustomStatus) {
        return false;
    }
    
    lastCustomStatus = currentStatusKey;
    
    if (!customStatus) {
        customStatusElement.innerHTML = '';
        separatorElement.style.display = 'none';
        return true;
    }
    
    customStatusElement.innerHTML = '';
    let hasStatusContent = false;
    
    if (customStatus.emoji) {
        if (customStatus.emoji.id) {
            const extension = customStatus.emoji.animated ? 'gif' : 'png';
            const emojiUrl = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${extension}`;
            const emojiImg = document.createElement('img');
            emojiImg.src = emojiUrl;
            emojiImg.alt = "emoji";
            emojiImg.className = "cstatus-emoji";
            customStatusElement.appendChild(emojiImg);
            hasStatusContent = true;
        } else if (customStatus.emoji.name) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = customStatus.emoji.name;
            customStatusElement.appendChild(emojiSpan);
            hasStatusContent = true;
        }
    }
    
    if (customStatus.state) {
        const textSpan = document.createElement('span');
        textSpan.textContent = customStatus.state;
        textSpan.style.overflow = 'hidden';
        textSpan.style.textOverflow = 'ellipsis';
        textSpan.style.whiteSpace = 'nowrap';
        textSpan.style.flexShrink = '1';
        textSpan.style.minWidth = '0';
        customStatusElement.appendChild(textSpan);
        hasStatusContent = true;
    }
    
    const hasUsernameContent = usernameElement.textContent.trim() !== '';
    if (hasStatusContent) {
        separatorElement.style.display = 'block';
    } else {
        separatorElement.style.display = 'none';
    }
    
    return true;
}

function updateActivities(activities) {
    lastActivities = activities ? [...activities] : [];
    
    const activitiesContainer = document.getElementById('activitiesContainer');
    activitiesContainer.innerHTML = '';
    const validActivities = activities ? activities.filter(activity => 
        activity.type !== 4 && activity.name !== 'Spotify'
    ) : [];
    
    validActivities.forEach((activity, index) => {
        const activityCard = document.createElement('div');
        activityCard.className = 'act aactive glass';
        activityCard.id = `activityCard-${index}`;
        
        let activityTitleText = '';
        switch (activity.type) {
            case 0: activityTitleText = 'Playing'; break;
            case 1: activityTitleText = 'Streaming'; break;
            case 2: activityTitleText = 'Listening to'; break;
            case 3: activityTitleText = 'Watching'; break;
            case 5: activityTitleText = 'Competing in'; break;
            default: activityTitleText = 'Active in';
        }
        
        if (activity.platform && activity.type === 0) {
            activityTitleText += ` ${activity.platform}`;
        }
        
        activityCard.innerHTML = `
            <div class="aheader">
                <svg class="aicon" viewBox="0 0 24 24" fill="#908caa">
                    <path d="M5.79335761,5 L18.2066424,5 C19.7805584,5 21.0868816,6.21634264 21.1990185,7.78625885 L21.8575059,17.0050826 C21.9307825,18.0309548 21.1585512,18.9219909 20.132679,18.9952675 C20.088523,18.9984215 20.0442685,19 20,19 C18.8245863,19 17.8000084,18.2000338 17.5149287,17.059715 L17,15 L7,15 L6.48507125,17.059715 C6.19999155,18.2000338 5.1754137,19 4,19 C2.97151413,19 2.13776159,18.1662475 2.13776159,17.1377616 C2.13776159,17.0934931 2.1393401,17.0492386 2.1424941,17.0050826 L2.80098151,7.78625885 C2.91311838,6.21634264 4.21944161,5 5.79335761,5 Z M14.5,10 C15.3284271,10 16,9.32842712 16,8.5 C16,7.67157288 15.3284271,7 14.5,7 C13.6715729,7 13,7.67157288 13,8.5 C13,9.32842712 13.6715729,10 14.5,10 Z M18.5,13 C19.3284271,13 20,12.3284271 20,11.5 C20,10.6715729 19.3284271,10 18.5,10 C17.6715729,10 17,10.6715729 17,11.5 C17,12.3284271 17.6715729,13 18.5,13 Z M6,9 L4,9 L4,11 L6,11 L6,13 L8,13 L8,11 L10,11 L10,9 L8,9 L8,7 L6,7 L6,9 Z"/>
                </svg>
                <div class="atitle">${activityTitleText}</div>
            </div>
            <div class="acontent">
                <div class="aimgwrap">
                    <img class="aimg" src="" alt="Activity">
                    <img class="aimgsm" src="" alt="Small Icon" style="display: none;">
                </div>
                <div class="ainfo">
                    <div class="aname">${activity.name}</div>
                    <div class="adetails">${activity.details || ''}</div>
                    <div class="astate">${activity.state || ''}</div>
                    <div class="atime" style="display: none;">
                        <svg class="ticon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        <span class="activity-time-text">0:00:00</span>
                    </div>
                    <div class="aprogress" style="display: none;">
                        <div class="pcont">
                            <div class="pbar"></div>
                        </div>
                        <div class="tiinfo">
                            <span class="activity-current-time">0:00</span>
                            <span class="activity-end-time">0:00</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="abuttons"></div>
        `;
        const largeImageElement = activityCard.querySelector('.aimg');
        const smallImageElement = activityCard.querySelector('.aimgsm');
        
        if (activity.assets) {
            if (activity.assets.large_image) {
                let largeImageUrl = activity.assets.large_image;
                if (largeImageUrl.startsWith('mp:')) {
                    largeImageUrl = `https://media.discordapp.net/${largeImageUrl.replace('mp:', '')}`;
                } else if (largeImageUrl.startsWith('spotify:')) {
                    largeImageUrl = `https://i.scdn.co/image/${largeImageUrl.replace('spotify:', '')}`;
                } else if (largeImageUrl.startsWith('external:')) {
                    largeImageUrl = largeImageUrl.replace('external:', '');
                } else if (largeImageUrl.startsWith('https%3A%2F%2F')) {
                    largeImageUrl = decodeURIComponent(largeImageUrl);
                } else {
                    largeImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImageUrl}.png?size=512`;
                }
                largeImageElement.src = largeImageUrl;
            } else if (activity.assets.small_image) {
                let smallImageUrl = activity.assets.small_image;
                if (smallImageUrl.startsWith('mp:')) {
                    smallImageUrl = `https://media.discordapp.net/${smallImageUrl.replace('mp:', '')}`;
                } else if (smallImageUrl.startsWith('spotify:')) {
                    smallImageUrl = `https://i.scdn.co/image/${smallImageUrl.replace('spotify:', '')}`;
                } else if (smallImageUrl.startsWith('external:')) {
                    smallImageUrl = smallImageUrl.replace('external:', '');
                } else {
                    smallImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${smallImageUrl}.png?size=512`;
                }
                largeImageElement.src = smallImageUrl;
            }
            
            if (activity.assets.small_image && activity.assets.large_image) {
                let smallImageUrl = activity.assets.small_image;
                if (smallImageUrl.startsWith('mp:')) {
                    smallImageUrl = `https://media.discordapp.net/${smallImageUrl.replace('mp:', '')}`;
                } else if (smallImageUrl.startsWith('spotify:')) {
                    smallImageUrl = `https://i.scdn.co/image/${smallImageUrl.replace('spotify:', '')}`;
                } else if (smallImageUrl.startsWith('external:')) {
                    smallImageUrl = smallImageUrl.replace('external:', '');
                } else {
                    smallImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${smallImageUrl}.png?size=128`;
                }
                smallImageElement.src = smallImageUrl;
                smallImageElement.style.display = 'block';
            }
        } else if (activity.application_id) {
            largeImageElement.src = `https://dcdn.dstn.to/app-icons/${activity.application_id}.png?size=512`;
        }
        
        const activityTimeElement = activityCard.querySelector('.atime');
        const activityProgressElement = activityCard.querySelector('.aprogress');
        if (activity.timestamps && activity.timestamps.start && activity.timestamps.end) {
            activityTimeElement.style.display = 'none';
            activityProgressElement.style.display = 'block';
            const startTime = activity.timestamps.start;
            const endTime = activity.timestamps.end;
            const duration = endTime - startTime;
            function updateActivityProgress() {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);
                activityProgressElement.querySelector('.pbar').style.width = `${progress}%`;
                const currentMinutes = Math.floor(elapsed / 60000);
                const currentSeconds = Math.floor((elapsed % 60000) / 1000);
                const totalMinutes = Math.floor(duration / 60000);
                const totalSeconds = Math.floor((duration % 60000) / 1000);
                activityProgressElement.querySelector('.activity-current-time').textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
                activityProgressElement.querySelector('.activity-end-time').textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
                if (progress >= 100) clearInterval(activityIntervals[activity.id]);
            }
            if (activityIntervals[activity.id]) clearInterval(activityIntervals[activity.id]);
            updateActivityProgress();
            activityIntervals[activity.id] = setInterval(updateActivityProgress, 100);
        } else if (activity.created_at) {
            activityTimeElement.style.display = 'flex';
            activityProgressElement.style.display = 'none';
            function updateActivityTime() {
                const startTime = activity.created_at;
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const hours = Math.floor(elapsed / 3600);
                const minutes = Math.floor((elapsed % 3600) / 60);
                const seconds = elapsed % 60;
                let timeText = '';
                if (hours > 0) {
                    timeText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                activityCard.querySelector('.activity-time-text').textContent = timeText;
            }
            updateActivityTime();
            activityIntervals[activity.id] = setInterval(updateActivityTime, 1000);
        }
        if (activity.buttons && activity.buttons.length > 0) {
            const buttonsContainer = activityCard.querySelector('.abuttons');
            activity.buttons.forEach(buttonText => {
                const button = document.createElement('a');
                button.className = 'abutton';
                let buttonUrl = '#';
                if (activity.metadata && activity.metadata.button_urls) {
                    const buttonIndex = activity.buttons.indexOf(buttonText);
                    if (activity.metadata.button_urls[buttonIndex]) {
                        buttonUrl = activity.metadata.button_urls[buttonIndex];
                    }
                } else if (activity.details_url && buttonText.toLowerCase().includes('listen') || buttonText.toLowerCase().includes('watch')) {
                    buttonUrl = activity.details_url;
                }
                button.href = buttonUrl;
                button.target = '_blank';
                button.textContent = buttonText;
                buttonsContainer.appendChild(button);
            });
        }
        activitiesContainer.appendChild(activityCard);
    });
    updateContainerLayout();
}

function updateContainerLayout() {
    const container = document.querySelector('.cont');
    const spotifyCard = document.getElementById('spotifyCard');
    const activitiesContainer = document.getElementById('activitiesContainer');
    if (!container || !spotifyCard || !activitiesContainer) return;
    const bodyStyle = window.getComputedStyle(document.body);
    const available = document.body.clientWidth - parseFloat(bodyStyle.paddingLeft) - parseFloat(bodyStyle.paddingRight);
    const columnWidth = 400;
    const columnGap = 10;
    const hasActivities = activitiesContainer.children.length > 0;
    const hasSpotify = spotifyCard.classList.contains('sactive');
    const profileColumn = container.querySelector('.pcol');
    const statusColumn = container.querySelector('.scol');
    if (profileColumn && statusColumn) {
        const target = hasActivities ? profileColumn : statusColumn;
        if (spotifyCard.parentElement !== target) {
            target.appendChild(spotifyCard);
        }
    }
    const maxColumns = Math.max(1, Math.floor((available + columnGap) / (columnWidth + columnGap)));
    const columns = (hasActivities || hasSpotify) && maxColumns >= 2 ? 2 : 1;
    const rows = columns === 2 ? 1 : 2;
    container.style.setProperty('--smart-columns', String(columns));
    container.style.setProperty('--smart-rows', String(rows));
}

document.addEventListener('DOMContentLoaded', function() {
    const enterScreen = document.getElementById('enterScreen');
    const bgMusic = document.getElementById('bgMusic');
    const muteBtn = document.getElementById('muteBtn');
    const muteIcon = muteBtn ? muteBtn.querySelector('i') : null;

    if (muteBtn && muteIcon) {
        muteBtn.addEventListener('click', function() {
            const isMuted = !bgMusic.muted;
            bgMusic.muted = isMuted;
            if (isMuted) {
                muteIcon.classList.remove('fa-volume-up');
                muteIcon.classList.add('fa-volume-xmark');
                muteBtn.classList.add('muted');
                muteBtn.setAttribute('aria-label', 'Unmute');
            } else {
                muteIcon.classList.remove('fa-volume-xmark');
                muteIcon.classList.add('fa-volume-up');
                muteBtn.classList.remove('muted');
                muteBtn.setAttribute('aria-label', 'Mute');
            }
        });
    }

    enterScreen.addEventListener('click', function() {
        if (hasEntered) return;
        hasEntered = true;
        enterScreen.classList.add('hidden');
        document.querySelector('.snow').classList.add('sshow');
        bgMusic.volume = 0.5;
        bgMusic.play().catch(e => console.log('Audio play failed:', e));

        connectWebSocket(currentUserId);
        fetchLanyardData(currentUserId);
    });

    window.addEventListener('resize', function() {
        updateContainerLayout();
    });
});
