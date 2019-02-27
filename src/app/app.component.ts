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

    // parse username and reponame from input[repoUrl]
    // https://github.com/apache{username}/couchdb{repo}
    const tokens = this.repoUrl.split('/');
    const userName = tokens[tokens.length - 2];
    const repoName = tokens[tokens.length - 1];
    // form baseurl for all open issues
    // used authentication for rate limit issue
    this.requestBaseUrl = 'https://api.github.com/repos/' + userName + '/' + repoName + '/' + 'issues' +
      '?client_id=' + config.client_id + '&client_secret=' + config.client_secret + '&state=open';
    this.fetchIssues(this.requestBaseUrl);

  }
  fetchIssues(requestBaseUrl) {

    const currDate = new Date().getTime();
    this.httpClient.get<any>(requestBaseUrl, { observe: 'response' })
      .subscribe(resp => {
        // get the "LINK" header for extracting no of pages
        const str = resp.headers.getAll('LINK');
        // if no LINK header ..issues are returned in one page only
        // tslint:disable-next-line:max-line-length
        // link →<https://api.github.com/repositories/27193779/issues?page=2>; rel="next", <https://api.github.com/repositories/27193779/issues?page=29>; rel="last"
        let lastPage = 1;
        // console.log(' single page case ', str);
        if (str != null) {
          // parse the last page no
          const startPos = str[0].lastIndexOf('page') + 5;
          const length = str[0].lastIndexOf('>') - startPos;
          lastPage = Number(str[0].substr(startPos, length));
        }
        for (let i = 1; i <= lastPage; i++) {
          // fetch issues for each page
          this.fetchIssuesPerPage(requestBaseUrl, i);
        }
      });

  }
  fetchIssuesPerPage(requestBaseUrl, pageNo) {
    this.httpClient.get<RepoIssue[]>(requestBaseUrl + '&page=' + pageNo).subscribe(
      data => {
        // assign incoming response to list of issues
        this.repoOpenIssues = data;
        this.filterIssues();
      },
      error => {
        console.log('Error', error);
      }
    );
  }
  filterIssues() {

    // filter open issues on the basis of creation date
    // pull requests are not considered as open issues
    // date comparison has done by converting to milisecs
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

  ngOnInit() {
    this.openIssueslt24hr = 0;
    this.openIssuesgt7day = 0;
    this.openIssuesgt24hrlt7day = 0;
    this.totalopenIssues = 0;
    this.repoUrl = 'https://github.com/facebook/react';
    // tested against
    // https://github.com/facebook/react total issues : 404
    // https://github.com/nodejs/node issues : 589
    // https://github.com/apache/couchdb issues : 157
    // https://github.com/apache/couchdb
    // https://github.com/warriorfort/expense-tracker-ui issues :4
    // https://github.com/angular/angular issues : 2331
  }
}
