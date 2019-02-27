import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RepoIssue } from './dto/RepoIssue';
import { config } from './config/Config';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: [],
  providers: []

})

export class AppComponent implements OnInit {

  repoUrl: string;
  requestBaseUrl: string;
  repoOpenIssues: RepoIssue[];
  openIssueslt24hr: number;
  openIssuesgt24hrlt7day: number;
  openIssuesgt7day: number;
  totalopenIssues: number;
  constructor(private httpClient: HttpClient, private fb: FormBuilder) {

  }
  process() {
    // reset values on every click
    this.openIssueslt24hr = 0;
    this.openIssuesgt7day = 0;
    this.openIssuesgt24hrlt7day = 0;
    this.totalopenIssues = 0;


    const tokens = this.repoUrl.split('/');
    const userName = tokens[tokens.length - 2];
    const repoName = tokens[tokens.length - 1];

    this.requestBaseUrl = 'https://api.github.com/repos/' + userName + '/' + repoName + '/' + 'issues' +
      '?client_id=' + config.client_id + '&client_secret=' + config.client_secret + '&state=open';
    this.fetchIssues(this.requestBaseUrl);

  }
  filterIssues() {

    const currDate = new Date();
    for (const repoIssue of this.repoOpenIssues) {

      if ((!repoIssue.pull_request) && (currDate.getTime() - new Date(repoIssue.created_at).getTime()) <= 1 * 1000 * 60 * 60 * 24) {
        this.openIssueslt24hr++;
      } else if ((!repoIssue.pull_request)
        && new Date(repoIssue.created_at).getTime() - ((currDate.getTime() - 7 * 1000 * 60 * 60 * 24)) >= 0
        && ((currDate.getTime() - new Date(repoIssue.created_at).getTime()) > 1000 * 60 * 60 * 24)) {
        this.openIssuesgt24hrlt7day++;
      } else if ((!repoIssue.pull_request)) {
        this.openIssuesgt7day++;
      }
    }

  }
  fetchIssuesPerPage(requestBaseUrl, pageNo) {
    this.httpClient.get<RepoIssue[]>(requestBaseUrl + '&page=' + pageNo).subscribe(
      data => {
        this.repoOpenIssues = data;
        this.filterIssues();
      },
      error => {
        console.log('Error', error);
      }
    );
  }
  fetchIssues(requestBaseUrl) {

    const currDate = new Date().getTime();
    const pastDate = currDate - 7 * (1000 * 60 * 60 * 24);
    this.httpClient.get<any>(requestBaseUrl, { observe: 'response' })
      .subscribe(resp => {
        const str = resp.headers.getAll('LINK');
        let lastPage = 1;
        // console.log(' single page case ', str);
        if (str != null) {

          const startPos = str[0].lastIndexOf('page') + 5;
          const length = str[0].lastIndexOf('>') - startPos;
          lastPage = Number(str[0].substr(startPos, length));
        }
        for (let i = 1; i <= lastPage; i++) {
          this.fetchIssuesPerPage(requestBaseUrl, i);
        }
      });

  }

  ngOnInit() {
    this.openIssueslt24hr = 0;
    this.openIssuesgt7day = 0;
    this.openIssuesgt24hrlt7day = 0;
    this.totalopenIssues = 0;
  }
}
