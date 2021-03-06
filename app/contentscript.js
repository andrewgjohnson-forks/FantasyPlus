/*-- TODO
- Add a "total" row for starting players (and on matchup preview), which at least has fpros, but also can do pts, avg, last, and proj
- Add standard deviation, ranking, injury adjusted average points, somehow adjust OPRK for shitty teams
- Fix bottom column on matchuppreview
- Somehow do all 9 requests at once
*/

/*
var tag = document.createElement("script");
tag.type="text/javascript";
tag.src = "http://code.jquery.com/jquery-latest.min.js";
document.body.appendChild(tag);
*/

$(document).ready(function () {
	// GLOBALS
	window.alldata = {};
	
	window.positions = ['qb', 'rb', 'wr', 'te', 'k'];
	window.idp_positions = ['6','8','9','10'];
	window.all_positions = window.positions.concat(window.idp_positions);
	
	window.idp_conversion = {'6': 'D/ST', '8': 'DL', '9': 'LB', '10': 'DB'};
	window.team_name_conversion = {'ARZ': 'ARI', 'GBP': 'GB', 'KCC': 'KC', 'NEP': 'NE', 'NOR': 'NO', 'SDC': 'SD', 'SFO': 'SF', 'TBB': 'TB', 'WAS': 'WSH'};
	
	//Get League Settings
	var league_id = document.URL.match(/leagueId=(\d+)/)[1];
	var xhr_league = new XMLHttpRequest();
	xhr_league.open("GET", 'http://games.espn.go.com/ffl/leaguesetup/sections/scoring?leagueId=' + league_id, false);
	xhr_league.send();
	parse_data(xhr_league.responseText);
	
	function parse_data(league_data) {
		window.league_settings = {};

		window.league_settings['pass_yds'] = $("td", league_data).filter(function() { return $.text([this]) == 'Passing Yards (PY)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PY5)') > -1; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PY10)') > -1; }).next().text()) / 10.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PY20)') > -1; }).next().text()) / 20.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PY25)') > -1; }).next().text()) / 25.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PY50)') > -1; }).next().text()) / 50.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PY100)') > -1; }).next().text()) / 100.0 || 0;
		window.league_settings['pass_tds'] = $("td", league_data).filter(function() { return $.text([this]) == 'TD Pass (PTD)'; }).next().text() || 0;
		window.league_settings['pass_ints'] = $("td", league_data).filter(function() { return $.text([this]) == 'Interceptions Thrown (INT)'; }).next().text() || 0;
		window.league_settings['pass_cmp'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Pass Completed (PC)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PC5)') > -1; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(PC10)') > -1; }).next().text()) / 10.0 || 0;
		window.league_settings['pass_icmp'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Incomplete Pass (INC)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(IP5)') > -1; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(IP10)') > -1; }).next().text()) / 10.0 || 0;
		window.league_settings['pass_att'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Pass Attempted (PA)'; }).next().text() || 0;
		window.league_settings['pass_300_bonus'] = $("td", league_data).filter(function() { return $.text([this]) == '300-399 yard passing game (P300)'; }).next().text() || 0;
		window.league_settings['pass_400_bonus'] = $("td", league_data).filter(function() { return $.text([this]) == '400+ yard passing game (P400)'; }).next().text() || 0;
		
		window.league_settings['rush_yds'] = $("td", league_data).filter(function() { return $.text([this]) == 'Rushing Yards (RY)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RY5)') > -1; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]) == 'Every 10 rushing yards (RY10)'; }).next().text()) / 10.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RY20)') > -1; }).next().text()) / 20.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RY25)') > -1; }).next().text()) / 25.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RY50)') > -1; }).next().text()) / 50.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RY100)') > -1; }).next().text()) / 100.0 || 0;
		window.league_settings['rush_att'] = $("td", league_data).filter(function() { return $.text([this]) == 'Rushing Attempts (RA)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RA5)') > -1; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(RA10)') > -1; }).next().text()) / 10.0 || 0;
		window.league_settings['rush_tds'] = $("td", league_data).filter(function() { return $.text([this]) == 'TD Rush (RTD)'; }).next().text() || 0;
		window.league_settings['rush_100_bonus'] = $("td", league_data).filter(function() { return $.text([this]) == '100-199 yard rushing game (RY100)'; }).next().text() || 0;
		window.league_settings['rush_200_bonus'] = $("td", league_data).filter(function() { return $.text([this]) == '200+ yard rushing game (RY200)'; }).next().text() || 0;
		
		window.league_settings['rec_yds'] = $("td", league_data).filter(function() { return $.text([this]) == 'Receiving Yards (REY)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]) == 'Every 5 receiving yards (REY5)'; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REY10)') > -1; }).next().text()) / 10.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REY20)') > -1; }).next().text()) / 20.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REY25)') > -1; }).next().text()) / 25.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REY50)') > -1; }).next().text()) / 50.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REY100)'); }).next().text()) / 100.0 || 0;
		window.league_settings['rec_att'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each reception (REC)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REC5)') > -1; }).next().text()) / 5.0 || parseFloat($("td", league_data).filter(function() { return $.text([this]).indexOf('(REC10)') > -1; }).next().text()) / 10.0 || 0;
		window.league_settings['rec_tds'] = $("td", league_data).filter(function() { return $.text([this]) == 'TD Reception (RETD)'; }).next().text() || 0;
		window.league_settings['rec_100_bonus'] = $("td", league_data).filter(function() { return $.text([this]) == '100-199 yard receiving game (REY100)'; }).next().text() || 0;
		window.league_settings['rec_200_bonus'] = $("td", league_data).filter(function() { return $.text([this]) == '200+ yard receiving game (REY200)'; }).next().text() || 0;
		//Receiving Target (RET)
		
		window.league_settings['xpt'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each PAT Made (PAT)'; }).next().text() || 0;
		window.league_settings['fgm'] = $("td", league_data).filter(function() { return $.text([this]) == 'Total FG Missed (FGM)'; }).next().text() || 0;
		window.league_settings['fga'] = $("td", league_data).filter(function() { return $.text([this]) == 'Total FG Attempted (FGA)'; }).next().text() || 0;
		window.league_settings['fg'] = $("td", league_data).filter(function() { return $.text([this]) == 'Total FG Made (FG)'; }).next().text() || 0;
		window.league_settings['fg_0'] = $("td", league_data).filter(function() { return $.text([this]) == 'FG Made (0-39 yards) (FG0)'; }).next().text() || 0;
		window.league_settings['fg_40'] = $("td", league_data).filter(function() { return $.text([this]) == 'FG Made (40-49 yards) (FG40)'; }).next().text() || 0;
		window.league_settings['fg_50'] = $("td", league_data).filter(function() { return $.text([this]) == 'FG Made (50+ yards) (FG50)'; }).next().text() || 0;
		//Each PAT Attempted (PATA)
		
		window.league_settings['fumbles'] = $("td", league_data).filter(function() { return $.text([this]) == 'Total Fumbles Lost (FUML)'; }).next().text() || 0;
		
		window.league_settings['ff'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Fumble Forced (FF)'; }).next().text() || 0;
		window.league_settings['tka'] = $("td", league_data).filter(function() { return $.text([this]) == 'Assisted Tackles (TKA)'; }).next().text() || 0;
		window.league_settings['tks'] = $("td", league_data).filter(function() { return $.text([this]) == 'Solo Tackles (TKS)'; }).next().text() || 0;
		window.league_settings['pd'] = $("td", league_data).filter(function() { return $.text([this]) == 'Passes Defensed (PD)'; }).next().text() || 0;
		
		window.league_settings['int'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Interception (INT)'; }).next().text() || 0;
		window.league_settings['deftd'] = $($("td", league_data).filter(function() { return $.text([this]) == 'Interception Return TD (INTTD)'; })[0]).next().text() || 0;
		window.league_settings['fr'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Fumble Recovered (FR)'; }).next().text() || 0;
		window.league_settings['sk'] = $("td", league_data).filter(function() { return $.text([this]) == 'Each Sack (SK)'; }).next().text() || parseFloat($("td", league_data).filter(function() { return $.text([this]) == '1/2 Sack (HALFSK)'; }).next().text()) * 2 || 0;
		
		window.league_settings['pa'] = $("td", league_data).filter(function() { return $.text([this]) == 'Points Allowed (PA)'; }).next().text() || 0;
		window.league_settings['pa0'] = $("td", league_data).filter(function() { return $.text([this]) == '0 points allowed (PA0)'; }).next().text() || 0;
		window.league_settings['pa1'] = $("td", league_data).filter(function() { return $.text([this]) == '1-6 points allowed (PA1)'; }).next().text() || 0;
		window.league_settings['pa7'] = $("td", league_data).filter(function() { return $.text([this]) == '7-13 points allowed (PA7)'; }).next().text() || 0;
		window.league_settings['pa14'] = $("td", league_data).filter(function() { return $.text([this]) == '14-17 points allowed (PA14)'; }).next().text() || 0;
		window.league_settings['pa18'] = $("td", league_data).filter(function() { return $.text([this]) == '18-21 points allowed (PA18)'; }).next().text() || 0;
		window.league_settings['pa22'] = $("td", league_data).filter(function() { return $.text([this]) == '22-27 points allowed (PA22)'; }).next().text() || 0;
		window.league_settings['pa28'] = $("td", league_data).filter(function() { return $.text([this]) == '28-34 points allowed (PA28)'; }).next().text() || 0;
		window.league_settings['pa35'] = $("td", league_data).filter(function() { return $.text([this]) == '35-45 points allowed (PA35)'; }).next().text() || 0;
		window.league_settings['pa46'] = $("td", league_data).filter(function() { return $.text([this]) == '46+ points allowed (PA46)'; }).next().text() || 0;
		
		window.league_settings['ya'] = $("td", league_data).filter(function() { return $.text([this]) == 'Yards Allowed (YA)'; }).next().text() || 0;
		window.league_settings['ya100'] = $("td", league_data).filter(function() { return $.text([this]) == 'Less than 100 total yards allowed (YA100)'; }).next().text() || 0;
		window.league_settings['ya199'] = $("td", league_data).filter(function() { return $.text([this]) == '100-199 total yards allowed (YA199)'; }).next().text() || 0;
		window.league_settings['ya299'] = $("td", league_data).filter(function() { return $.text([this]) == '200-299 total yards allowed (YA299)'; }).next().text() || 0;
		window.league_settings['ya349'] = $("td", league_data).filter(function() { return $.text([this]) == '300-349 total yards allowed (YA349)'; }).next().text() || 0;
		window.league_settings['ya399'] = $("td", league_data).filter(function() { return $.text([this]) == '350-399 total yards allowed (YA399)'; }).next().text() || 0;
		window.league_settings['ya449'] = $("td", league_data).filter(function() { return $.text([this]) == '400-449 total yards allowed (YA449)'; }).next().text() || 0;
		window.league_settings['ya499'] = $("td", league_data).filter(function() { return $.text([this]) == '450-499 total yards allowed (YA499)'; }).next().text() || 0;
		window.league_settings['ya549'] = $("td", league_data).filter(function() { return $.text([this]) == '500-549 total yards allowed (YA549)'; }).next().text() || 0;
		window.league_settings['ya550'] = $("td", league_data).filter(function() { return $.text([this]) == '550+ total yards allowed (YA550)'; }).next().text() || 0;
		
		//console.log(window.league_settings);
		getPosProjections();
	}
	
	
	//Get the data from external sites
	function getAllProjections(position) {
		if (window.positions.indexOf(position) > -1) {
			source_site = 'http://www.fantasypros.com/nfl/projections/' + position + '.php?filters=44:45:73:152:469&export=xls';
		}
		else {
			source_site = 'http://www.fantasysharks.com/apps/bert/forecasts/projections.php?csv=1&Position=' + position;
		}
		
		var allxhr = new XMLHttpRequest();
		allxhr.open("GET", source_site, false);
		allxhr.send();
		return allxhr.responseText;
	}
	
	// credit to stackoverflow
	function parsesiteCSV(str) {
		var arr = [];
		var quote = false;
		
		for (var row = col = c = 0; c < str.length; c++) {
			var cc = str[c], nc = str[c+1];
			arr[row] = arr[row] || [];
			arr[row][col] = arr[row][col] || '';
			
			if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  
			if (cc == '"') { quote = !quote; continue; }
			if (cc == ',' && !quote) { ++col; continue; }
			if (cc == '\n' && !quote) { ++row; col = 0; continue; }

			arr[row][col] += cc;
		}

		return arr;
	}
	
	function getPosProjections() {
		for (var p=0; p < window.all_positions.length; p++) {
			p_name = window.all_positions[p];
			retrieved_proj = getAllProjections(p_name);
			retrieved_proj = retrieved_proj.trim();
			if (window.positions.indexOf(p_name) > -1) {
				player_heading = 'Player Name';
				pos_name = p_name.toUpperCase();
				retrieved_proj = retrieved_proj.split('\n').splice(4);
				
				parsed_proj = [];
				for (var t=0; t < retrieved_proj.length; t++) {
					parsed_proj[t] = retrieved_proj[t].split("\t");
				}
			}
			else {
				player_heading = 'Player';
				pos_name = window.idp_conversion[p_name];
				parsed_proj = parsesiteCSV(retrieved_proj);
			}
			
			headers = parsed_proj[0];
			for (var h=0; h < headers.length; h++) {
				headers[h] = headers[h].trim();
			}
			
			team_header = headers.indexOf('Team');
			player_name_header = headers.indexOf(player_heading);
			
			for (var i=1; i < parsed_proj.length; i++) {
				var playerdata = {};
				var currentline = parsed_proj[i];
				
				team_name = currentline[team_header].trim();
				if (window.team_name_conversion.hasOwnProperty(team_name)) {
					team_name = window.team_name_conversion[team_name];
				}
				
				player_name = currentline[player_name_header].trim();
				
				if (window.idp_positions.indexOf(p_name) > -1) {
					//DST
					if (p_name == '6') {
						player_name = player_name.split(',')[0] + ' D/ST';
						team_name = "-";
					}
					//Other IDPs, reversing names
					else {
						player_name = player_name.split(',')[1] + " " + player_name.split(',')[0]
					}
					
					player_name = player_name.trim();
				}
				
				// Add team and position to player_name for differentiating duplicate names
				full_name = player_name + "|" + pos_name + "|" + team_name;
				
				for (var j = player_name_header + 1; j < headers.length - 1; j++) {
					playerdata[headers[j].trim()] = currentline[j].trim();
				}
				
				window.alldata[full_name] = playerdata;
			}
		}
		
		addProjections();
	}

	function calculateProjections(player_name, pos_name, team_name) {
		// get their projected data from window.alldata
		// multiply it by the league settings
		full_name = player_name + "|" + pos_name + "|" + team_name;
		
		player_data = window.alldata[full_name]
		
		if (typeof(player_data) === "undefined") {
			if (player_name == 'Steve Smith Sr.') {
				player_name = 'Steve Smith';
			}
			else if (player_name == 'EJ Manuel') {
				player_name = 'E.J. Manuel';
			}
			else if (player_name == 'T.Y. Hilton') {
				player_name = 'Ty Hilton';
			}
			else if (player_name == 'Stevie Johnson') {
				player_name = 'Steve Johnson';
			}
			else if (player_name == 'Ha Ha Clinton-Dix') {
				player_name = 'Hasean Clinton-Dix';
			}
			else if (player_name.split(' ')[0] == 'Chris') {
				player_name = 'Christopher ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Christopher') {
				player_name = 'Chris ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Benjamin') {
				player_name = 'Benny ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Benny') {
				player_name = 'Benjamin ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Tim') {
				player_name = 'Timothy ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Timothy') {
				player_name = 'Tim ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Rob') {
				player_name = 'Robert ' + player_name.split(' ').slice(1).join(' ');
			}
			else if (player_name.split(' ')[0] == 'Robert') {
				player_name = 'Rob ' + player_name.split(' ').slice(1).join(' ');
			}
			else {
				return("??");
			}
			
			full_name = player_name + "|" + pos_name + "|" + team_name;
			player_data = window.alldata[full_name];
			if (typeof(player_data) === "undefined") {
				return("??");
			}
		}
		
		//console.log(player_data);
		
		player_score =
			window.league_settings['pass_yds'] * (player_data['pass_yds'] || 0) +
			window.league_settings['pass_tds'] * (player_data['pass_tds'] || 0) +
			window.league_settings['pass_ints'] * (player_data['pass_ints'] || 0) +
			window.league_settings['pass_att'] * (player_data['pass_att'] || 0) +
			window.league_settings['pass_cmp'] * (player_data['pass_cmp'] || 0) +
			window.league_settings['pass_icmp'] * ((player_data['pass_att'] || 0) - (player_data['pass_cmp'] || 0)) +	
			window.league_settings['pass_300_bonus'] * (300 <= player_data['pass_yds'] && player_data['pass_yds'] < 400) +
			window.league_settings['pass_400_bonus'] * ((player_data['pass_yds'] || 0) >= 400) +
		
			window.league_settings['rush_yds'] * (player_data['rush_yds'] || 0) +
			window.league_settings['rush_tds'] * (player_data['rush_tds'] || 0) +
			window.league_settings['rush_att'] * (player_data['rush_att'] || 0) +
			window.league_settings['rush_100_bonus'] * (100 <= player_data['rush_yds'] && player_data['rush_yds'] < 200) +
			window.league_settings['rush_200_bonus'] * ((player_data['rush_yds'] || 0) >= 200) +
			
			window.league_settings['rec_yds'] * (player_data['rec_yds'] || 0) +
			window.league_settings['rec_att'] * (player_data['rec_att'] || 0) +
			window.league_settings['rec_tds'] * (player_data['rec_tds'] || 0) +
			window.league_settings['rec_100_bonus'] * (100 <= player_data['rec_yds'] && player_data['rec_yds'] < 200) +
			window.league_settings['rec_200_bonus'] * ((player_data['rec_yds'] || 0) >= 200) +
			
			window.league_settings['xpt'] * (player_data['xpt'] || 0) +
			window.league_settings['fg'] * (player_data['fg'] || 0) +
			((0.6 * (window.league_settings['fg_0'] || 3)) + (0.3 * (window.league_settings['fg_40'] || 3)) + (0.1 * (window.league_settings['fg_50'] || 3))) * (player_data['fg'] || 0) +
			window.league_settings['fga'] * (player_data['fga'] || 0) +
			window.league_settings['fgm'] * ((player_data['fga'] || 0) - (player_data['fg'] || 0)) +
			
			window.league_settings['fumbles'] * (player_data['fumbles'] || 0) +
			
			window.league_settings['sk'] * (player_data['Scks'] || 0) +
			window.league_settings['ff'] * (player_data['FumFrc'] || 0) +
			window.league_settings['tka'] * (player_data['Tack'] || 0) +
			window.league_settings['tks'] * (player_data['Asst'] || 0) +
			window.league_settings['pd'] * (player_data['PassDef'] || 0) +
			window.league_settings['int'] * (player_data['Int'] || 0) +
			window.league_settings['deftd'] * (player_data['DefTD'] || 0) +
			window.league_settings['fr'] * (player_data['Fum'] || 0) +
		
			window.league_settings['pa'] * (player_data['Pts Agn'] || 0) +
			window.league_settings['pa0'] * (player_data['Pts Agn'] == 0) +
			window.league_settings['pa1'] * (0 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 6) +
			window.league_settings['pa7'] * (6 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 13) +
			window.league_settings['pa14'] * (13 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 17) +
			window.league_settings['pa18'] * (17 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 21) +
			window.league_settings['pa22'] * (21 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 27) +
			window.league_settings['pa28'] * (27 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 34) +
			window.league_settings['pa35'] * (34 < player_data['Pts Agn'] && player_data['Pts Agn'] <= 45) +
			window.league_settings['pa46'] * (45 < player_data['Pts Agn']) +
			
			window.league_settings['ya'] * (player_data['Yds Allowed'] || 0) +
			window.league_settings['ya100'] * (0 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 100) +
			window.league_settings['ya199'] * (100 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 200) +
			window.league_settings['ya299'] * (200 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 300) +
			window.league_settings['ya349'] * (300 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 350) +
			window.league_settings['ya399'] * (350 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 400) +
			window.league_settings['ya449'] * (400 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 450) +
			window.league_settings['ya499'] * (450 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 500) +
			window.league_settings['ya549'] * (500 <= player_data['Yds Allowed'] && player_data['Yds Allowed'] < 550) +
			window.league_settings['ya550'] * (550 <= player_data['Yds Allowed']);

		//console.log(player_score);
		return(Math.round(player_score * 100) / 100);
	}
	
	function addProjections() {
		$('.ExtraProjectionsFantasypros').remove();
		
		//Add header cells
		heads = $('[id^=playertable_] tbody tr.playerTableBgRowSubhead td').filter(function() {
			return $(this).text() == 'PROJ';
		});
		header_index = $(heads[0]).index();
		if (header_index > -1) {
			heads.after('<td class="playertableStat ExtraProjectionsFantasypros ExtraProjectionsFantasyprosHeader">FPros</td>');
			
			$('.playerTableBgRowHead.tableHead.playertableSectionHeader').find('th:last').attr('colspan',6);
			
			playerNameRows = $('[id^=playertable_] tbody tr.playerTableBgRowSubhead td').filter(function() {
				return $(this).text() == 'PLAYER, TEAM POS';
			});
			playerNameIndex = $(playerNameRows[0]).index();
			//for each player name
			$.each($('[id^=playertable_] tbody tr.pncPlayerRow').not('.emptyRow'), function() {
				var currRow = $(this);
				
				byeweek = $($('[id^=playertable_] tbody tr.playerTableBgRowSubhead td').filter(function() {
					return $(this).text() == 'OPP';
				})[0]).index();
				byeweek_text = currRow.find('td').eq(byeweek).text();
				
				if (!byeweek_text) {
					projPoints = "-";
					adj_header_index = header_index;
				}
				else if (byeweek_text == "** BYE **") {
					projPoints = "-";
					adj_header_index = header_index - 1;
				}
				else {
					adj_header_index = header_index;
					
					player_cell = currRow.find('td').eq(playerNameIndex);
					if (player_cell.text().indexOf('D/ST') > -1) {
						var player_name = $(player_cell).find('a').text().trim();
						var team_name = "-";
						var pos_name = 'D/ST';
					}
					else {
						var player_name = player_cell.text().split(",")[0];
						var team_pos = player_cell.text().split(",")[1].split(/\s|\xa0/);
						var team_name = team_pos[1].toUpperCase();
						var pos_name = team_pos[2];
						if ((pos_name == 'DT') || (pos_name == 'DE')) {
							pos_name = 'DL';
						}
						else if ((pos_name == 'CB') || (pos_name == 'S')) {
							pos_name = 'DB';
						}
					}
					player_name = player_name.replace('*','');
					
					projPoints = calculateProjections(player_name, pos_name, team_name);
				}

				currRow.find('td').eq(adj_header_index).after('<td class="playertableStat ExtraProjectionsFantasypros">' + projPoints + '</td');
			});
		}
	}
	
	if (document.URL.match(/ffl\/(freeagency|clubhouse)/)) {
		var observerConfig = {
			childList: true,
			characterData: true,
			subtree: true
		};
		var target_observe = document.querySelector('.playerTableContainerDiv');
		var observerESPN = new MutationObserver(function (mutations) {
			observerESPN.disconnect();
			if (mutations.length > 0) {
				addProjections();
			}
			observerESPN.observe(target_observe, observerConfig);
		});
		observerESPN.observe(target_observe, observerConfig);
	}
});