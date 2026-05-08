const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Sidebar Candidates Icon: Add margin, ensure it displays, maybe base64 it or just fix img. 
// I'll just change the old fa-volume-up or whatever is there, wait, I already changed it to <img src="images/candidate-icon.jpg"...
html = html.replace(/<img src="images\/candidate-icon\.jpg" alt="user" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;">/g, '<img src="images/candidate-icon.jpg" alt="user" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; display: inline-block;">');

// Wait, the previous plus replace:
const oldListRegex = /<ul class="detail-sidebar-links">[\s\S]*?<li>Notes[\s\S]*?<li>Answered Assess...<\/li>\s*<\/ul>/;
const newList = 
<ul class="detail-sidebar-links">
    <li>Notes <div style="display:flex; align-items:center;"><span class="sidebar-bubble hidden" id="sidebar-notes-count"></span><i class="fas fa-plus hover-plus" title="Add"></i></div></li>
    <li>Ratings and Revie... <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Attachments <div style="display:flex; align-items:center;"><span class="sidebar-bubble hidden" id="sidebar-atts-count"></span><i class="fas fa-plus hover-plus" title="Add"></i></div></li>
    <li>Interviews <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Emails <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Hiring Manager S... <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Offer Letters <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Invited Events <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Campaigns <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>To-Dos <i class="fas fa-plus hover-plus" title="Add"></i></li>
    <li>Answered Assess... <i class="fas fa-plus hover-plus" title="Add"></i></li>
</ul>;

html = html.replace(oldListRegex, newList);

// 2. Candidate Stages
const oldStagesRegex = /<div class="timeline-bar-container">[\s\S]*?<div id="timeline-circles"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newStages = <div class="candidate-boxes-container">
                                        <div class="candidate-box active">
                                            <div class="box-circle"></div>
                                            <div class="box-label">New</div>
                                        </div>
                                        <div class="candidate-box">
                                            <div class="box-circle"></div>
                                            <div class="box-label">In Review</div>
                                        </div>
                                        <div class="candidate-box">
                                            <div class="box-circle"></div>
                                            <div class="box-label">Available</div>
                                        </div>
                                        <div class="candidate-box">
                                            <div class="box-circle"></div>
                                            <div class="box-label">Engaged</div>
                                        </div>
                                        <div class="candidate-box">
                                            <div class="box-circle"></div>
                                            <div class="box-label">Offered</div>
                                        </div>
                                        <div class="candidate-box">
                                            <div class="box-circle"></div>
                                            <div class="box-label">Hired</div>
                                        </div>
                                        <div class="candidate-box border-0">
                                            <div class="box-circle"></div>
                                            <div class="box-label">Rejected</div>
                                        </div>
                                    </div>
                                </div>
                            </div>;

html = html.replace(oldStagesRegex, newStages);

fs.writeFileSync('index.html', html, 'utf8');
console.log("Robots replaced list and timeline");
