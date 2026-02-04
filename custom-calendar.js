class CustomCalendar extends HTMLElement {
    static observedAttributes = ['events'];
    
    constructor() {
        super();
        this.currentDate = new Date();
        this.events = [];
        this.currentTooltip = null;
        this.currentTooltipDay = null;
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.loadAddToCalendarScript();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'events' && newValue) {
            try {
                this.events = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error('Invalid events JSON:', e);
            }
        }
    }
    
    setupAddToCalendarObserver() {
        const observer = new MutationObserver((mutations) => {
            if (!this.atcbLoaded && typeof atcb === 'undefined') {
                this.loadAddToCalendarScript();
            }
        });
        
        observer.observe(this.shadowRoot, { 
            childList: true, 
            subtree: true 
        });
    }
    
    loadAddToCalendarScript() {
        if (this.atcbLoaded || typeof atcb !== 'undefined') return;
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/add-to-calendar-button@2';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            this.atcbLoaded = true;
            this.updateAddToCalendarButtons();
        };
        document.head.appendChild(script);
    }
    
    updateAddToCalendarButtons() {
        const buttons = this.shadowRoot.querySelectorAll('add-to-calendar-button');
        buttons.forEach(btn => {
            if (typeof atcb_action !== 'undefined') {
                atcb_action();
            }
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, (m) => map[m]);
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${this.getStyles()}
            </style>
            ${this.getCalendarHTML()}
        `;
        
        this.setupEvents();
    }
    
    getStyles() {
        //jw is a meme from the website this was orginally created for this isn't actual jw related....
        return `
.jw-calendar-container {
    font-family: "Raleway", "sans-serif";
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
}

.jw-calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.jw-calendar-nav-button {
    background: transparent;
    color: var(--jw-swatch--heading-color, #c4a127);
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    font-family: "Raleway", "sans-serif";
    font-size: 1.4rem;
    transition: transform 200ms ease;
}

.jw-calendar-nav-button:hover {
    transform: scale(1.2);
}

.jw-current-month {
    font-size: 1.8rem;
    font-weight: 400;
    color: var(--jw-swatch--heading-color, #c4a127);
    font-family: "Lobster Two", "fantasy";
}

.jw-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
}

.jw-calendar-day-header {
    color: var(--w-color, #424242);
    text-align: center;
    font-weight: 600;
    font-size: 1.1rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 1px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.jw-calendar-day {
    aspect-ratio: 1 / 1;
    background: var(--jw-subsection__background-color--default, white);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    cursor: default;
}

.jw-calendar-day.jw-has-event {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    cursor: pointer;
    transition: transform 200ms ease, box-shadow 200ms ease;
}

.jw-event-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    opacity: 0;
}

.jw-calendar-day.jw-has-event:hover .jw-event-overlay {
    opacity: 1;
}

.jw-day-number {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 0.9rem;
    color: white;
    font-weight: 600;
    z-index: 2;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.jw-calendar-day:not(.jw-has-event) .jw-day-number {
    color: var(--w-color, #424242);
    text-shadow: none;
}

.jw-event-count {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: var(--w-accent-color, #c4a127);
    color: white;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 6px;
    z-index: 2;
}

.jw-other-month {
    opacity: 0.3;
    background: var(--jw-subsection__background-color--shaded, #f2f2f2);
}

.jw-event-tooltip {
    position: absolute;
    z-index: 10000;
    background: var(--jw-subsection__background-color--default, white);
    border-radius: 6px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    padding: 20px;
    width: 320px;
    max-width: 90vw;
    pointer-events: auto;
    border: 1px solid var(--w-line-color, rgba(66,66,66,0.08));
    font-family: "Raleway", "sans-serif";
    animation: jw-tooltip-fade 200ms ease;
}

@keyframes jw-tooltip-fade {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.jw-tooltip-date {
    color: var(--jw-swatch--heading-color, #c4a127);
    font-family: "Lobster Two", "fantasy";
    font-size: 1.4rem;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--w-line-color, rgba(66,66,66,0.08));
}

.jw-tooltip-event {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--w-line-color, rgba(66,66,66,0.08));
}

.jw-tooltip-event:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.jw-tooltip-title {
    color: var(--w-color, #424242);
    text-decoration: none;
    cursor: pointer;
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 5px;
}

.jw-tooltip-time {
    color: var(--w-link-color, #1f628e);
    font-size: 1.1rem;
    margin-bottom: 8px;
}

.jw-tooltip-location {
    color: var(--w-color, #424242);
    font-size: 1.1rem;
    margin-bottom: 10px;
}

.jw-tooltip-link {
    margin-top: 5px;
}

.jw-tooltip-location a {
    color: var(--w-link-color, #1f628e);
    text-decoration: none;
    transition: all 200ms ease;
    cursor: pointer;
    display: inline-block;
}

.jw-tooltip-location a:hover,
.jw-tooltip-link a:hover {
    color: var(--jw-button-color-125-accent, #2470a3);
}

@media (max-width: 1020px) {
    .jw-calendar-grid {
        gap: 6px;
    }
    
    .jw-calendar-day-header {
        font-size: 0.9rem;
        height: 35px;
    }
}

@media (max-width: 768px) {
    .jw-calendar-header {
        margin-bottom: 20px;
    }
    
    .jw-current-month {
        font-size: 1.5rem;
    }
    
    .jw-calendar-nav-button {
        font-size: 1.2rem;
        padding: 6px 10px;
    }
    
    .jw-calendar-grid {
        gap: 4px;
    }
    
    .jw-calendar-day-header {
        font-size: 0.8rem;
        height: 30px;
    }
    
    .jw-day-number {
        font-size: 0.8rem;
        top: 6px;
        right: 6px;
    }
    
    .jw-event-tooltip {
        width: 280px;
        padding: 15px;
    }
    
    .jw-tooltip-date {
        font-size: 1.2rem;
    }
    
    .jw-tooltip-title {
        font-size: 1.1rem;
    }
    
    .jw-tooltip-time,
    .jw-tooltip-location {
        font-size: 1rem;
    }
}

@media (max-width: 480px) {
    .jw-calendar-grid {
        gap: 3px;
    }
    
    .jw-calendar-day-header {
        font-size: 0.7rem;
        height: 25px;
    }
    
    .jw-day-number {
        font-size: 0.7rem;
    }
    
    .jw-event-tooltip {
        width: 250px;
        padding: 12px;
        max-width: calc(100vw - 40px);
    }
}

@media (hover: none) and (pointer: coarse) {
    .jw-event-tooltip {
        display: none !important;
    }
    
    .jw-calendar-day.jw-has-event:hover {
        transform: none;
        box-shadow: none;
    }
    
    .jw-calendar-day.jw-has-event {
        cursor: default;
    }
}
        `;
    }
    
    getCalendarHTML() {
        const monthYear = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        let html = `
            <div class="jw-calendar-header">
                <button class="jw-calendar-nav-button jw-prev-month">←</button>
                <div class="jw-current-month">${monthYear}</div>
                <button class="jw-calendar-nav-button jw-next-month">→</button>
            </div>
            <div class="jw-calendar-grid">
        `;
        
        const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
        days.forEach(day => {
            html += `<div class="jw-calendar-day-header">${day}</div>`;
        });
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay();
    
        for (let i = 0; i < startingDay; i++) {
            html += '<div class="jw-calendar-day jw-other-month"></div>';
        }
    
        for (let day = 1; day <= totalDays; day++) {
            const currentDateStr = `${this.currentDate.getFullYear()}-${(this.currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const eventsForDay = this.getEventsForDay(currentDateStr);
            
            let dayClass = 'jw-calendar-day';
            let dayStyle = '';
            let eventData = '';
            let overlayHTML = '';
            let countHTML = '';
            
            if (eventsForDay.length > 0) {
                dayClass += ' jw-has-event';
                const event = eventsForDay[0];
                
                if (event.image) {
                    dayStyle = ` style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${this.escapeHtml(event.image)})"`;
                } else if (event.color) {
                    dayStyle = ` style="background-color: ${this.escapeHtml(event.color)}"`;
                }
                
                eventData = ` data-events='${JSON.stringify(eventsForDay).replace(/'/g, "&apos;")}' data-day="${day}"`;
                overlayHTML = '<div class="jw-event-overlay"></div>';
                
                if (eventsForDay.length > 1) {
                    countHTML = `<div class="jw-event-count">+${eventsForDay.length - 1}</div>`;
                }
            }
            
            html += `
                <div class="${dayClass}"${dayStyle}${eventData}>
                    <div class="jw-day-number">${day}</div>
                    ${overlayHTML}
                    ${countHTML}
                </div>
            `;
        }
        
        html += '</div>';
        
        this.hideTooltip();
        return html;
    }
    
    getEventsForDay(dateString) {
        return this.events.filter(event => {
            const currentDate = new Date(dateString);
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate && event.endDate !== '' ? event.endDate : event.startDate);
            return currentDate >= eventStart && currentDate <= eventEnd;
        });
    }
    
    setupEvents() {
        const shadow = this.shadowRoot;
        const eventDays = shadow.querySelectorAll('.jw-calendar-day.jw-has-event');
        
        shadow.querySelector('.jw-prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        shadow.querySelector('.jw-next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        eventDays.forEach(dayEl => {
            dayEl.addEventListener('mouseenter', () => this.showTooltip(dayEl));
            dayEl.addEventListener('mouseleave', (e) => {
                const tooltip = shadow.querySelector('.jw-event-tooltip');
                if (tooltip && tooltip.contains(e.relatedTarget)) {
                    return;
                }
                this.hideTooltip();
            });
        });
    }
    
    showTooltip(dayElement) {
        if (this.currentTooltipDay === dayElement && this.currentTooltip) {
            return;
        }
        
        this.hideTooltip();
        
        const eventsData = dayElement.getAttribute('data-events');
        if (!eventsData) return;
        
        const events = JSON.parse(eventsData);
        const tooltip = document.createElement('div');
        tooltip.className = 'jw-event-tooltip';
        
        this.currentTooltip = tooltip;
        this.currentTooltipDay = dayElement;
        
        const dayNum = dayElement.querySelector('.jw-day-number').textContent;
        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), parseInt(dayNum));
        const dateStr = date.toLocaleDateString('nl-BE', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'jw-tooltip-date';
        dateHeader.textContent = dateStr;
        tooltip.appendChild(dateHeader);
        
        events.forEach(event => {
            const eventEl = this.createEventElement(event);
            tooltip.appendChild(eventEl);
        });
        
        tooltip.addEventListener('mouseenter', () => {
        });
        
        tooltip.addEventListener('mouseleave', (e) => {
            if (!e.relatedTarget || !e.relatedTarget.closest('.jw-calendar-day.jw-has-event')) {
                this.hideTooltip();
            }
        });
        
        this.shadowRoot.appendChild(tooltip);
        
        this.positionTooltip(dayElement, tooltip);
    }
    
    createEventElement(event) {
        const eventEl = document.createElement('div');
        eventEl.className = 'jw-tooltip-event';
        
        const title = document.createElement('a');
        title.className = 'jw-tooltip-title';
        title.textContent = event.title;

        if (event.link) {
            title.href = event.link;
            title.target = '_blank';
            title.rel = 'noopener noreferrer';
            title.addEventListener('click', (e) => e.stopPropagation());
        }
        eventEl.appendChild(title);
        
        if (event.startTime) {
            const time = document.createElement('div');
            time.className = 'jw-tooltip-time';
            
            let timeText = event.startTime;
            if (event.endTime) {
                timeText += ` - ${event.endTime}`;
            }
            time.textContent = timeText;
            eventEl.appendChild(time);
        }
        
        if (event.location) {
            const location = document.createElement('div');
            location.className = 'jw-tooltip-location';
            
            if (event.locationLink) {
                const locationLink = document.createElement('a');
                locationLink.href = event.locationLink;
                locationLink.target = '_blank';
                locationLink.rel = 'noopener noreferrer';
                locationLink.textContent = event.location;
                locationLink.addEventListener('click', (e) => e.stopPropagation());
                location.appendChild(locationLink);
            } else {
                location.textContent = event.location;
            }
            eventEl.appendChild(location);
        }

        const test = document.createElement('div');
        test.innerHTML = `
            <add-to-calendar-button
                styleLight="--btn-background: var(--jw-swatch--heading-color, #c4a127); --btn-text: white; --btn-border: none; --btn-border-radius: 6px; --btn-padding: 8px 16px; --btn-hover-background: var(--jw-swatch--heading-color, #c4a127); --btn-hover-text: white; --btn-font: 'Raleway', sans-serif;"
                name="${this.escapeHtml(event.title)}"
                startDate="${event.startDate}"
                endDate="${event.endDate ? `${event.endDate}"` : `${event.startDate}"`}
                startTime="${event.startTime ? `${event.startTime}"` : '"'}
                endTime="${event.endTime ? `${event.endTime}"` : event.startTime? `${this.addOneHour(event.startTime)}"`: '"'}
                location="${this.escapeHtml(event.location || '')}"
                description="${this.escapeHtml(event.link || '')}"
                timeZone="Europe/Brussels"
                options="'Google','Apple','Outlook.com'"
                buttonStyle="simple"
                hideIconList
                buttonsList
                hideBackground
                hideCheckmark
                lightMode="bodyScheme"
            ></add-to-calendar-button>
        `
        eventEl.appendChild(test);
        
        
        
        return eventEl;
    }
    
    positionTooltip(dayElement, tooltip) {
        const dayRect = dayElement.getBoundingClientRect();
        const hostRect = this.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        
        let left = dayRect.right;
        let top = dayRect.top + scrollY;
        
        if (left + tooltipRect.width > viewportWidth - 20) {
            left = dayRect.left - tooltipRect.width;
            
            if (left < 20) {
                left = Math.max(20, dayRect.left + scrollX - (tooltipRect.width / 2) + (dayRect.width / 2));
                top = dayRect.bottom + scrollY + 10;
                
                if (top + tooltipRect.height > scrollY + viewportHeight - 20) {
                    top = dayRect.top + scrollY - tooltipRect.height - 10;
                }
            }
        }
        
        if (left < 20) left = 20;
        if (left + tooltipRect.width > viewportWidth - 20) {
            left = viewportWidth - tooltipRect.width - 20;
        }
        
        if (top < scrollY + 20) top = scrollY + 20;
        if (top + tooltipRect.height > scrollY + viewportHeight - 20) {
            top = scrollY + viewportHeight - tooltipRect.height - 20;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
            this.currentTooltipDay = null;
        }
    }
    

    addOneHour(timeStr) {
        if (!timeStr) return '';
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        
        date.setTime(date.getTime() + (60 * 60 * 1000));
        
        const newHours = date.getHours().toString().padStart(2, '0');
        const newMinutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${newHours}:${newMinutes}`;
    }
}

if (!customElements.get('custom-calendar')) {
    customElements.define('custom-calendar', CustomCalendar);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomCalendar;
}