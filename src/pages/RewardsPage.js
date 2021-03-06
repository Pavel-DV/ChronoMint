import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Paper, RaisedButton} from 'material-ui'
import withSpinner from '../hoc/withSpinner'
import Slider from '../components/common/slider'
import PageBase from './PageBase2'
import {getRewardsData, withdrawRevenue, closePeriod} from '../redux/rewards/rewards'
import globalStyles from '../styles'

const mapStateToProps = (state) => ({
  rewardsData: state.get('rewards').data,
  account: state.get('session').account,
  isFetching: state.get('rewards').isFetching,
  isReady: state.get('rewards').isReady
})

const mapDispatchToProps = (dispatch) => ({
  getRewardsData: (account) => dispatch(getRewardsData(account)),
  handleWithdrawRevenue: (account) => dispatch(withdrawRevenue(account)),
  handleClosePeriod: (account) => dispatch(closePeriod(account))
})

const styles = {
  ongoing: {
    color: 'orange'
  },
  closed: {
    color: 'green'
  },
  statusBlock: {
    textAlign: 'right',
    float: 'right',
    width: 130,
    marginLeft: 10,
    marginBottom: 10,
    padding: 0,
    fontSize: 13
  }
}

const ongoingStatusBlock = (daysPassed, periodLength) => (
  <div style={styles.statusBlock}>
    <div style={styles.ongoing}>
      ONGOING<br />
    </div>
    <Slider value={periodLength ? (daysPassed / periodLength).toFixed(2) : 1} />
  </div>
)

const closedStatusBlock = (
  <div style={styles.statusBlock}>
    <div style={styles.closed}>
      CLOSED
    </div>
  </div>
)

@connect(mapStateToProps, mapDispatchToProps)
@withSpinner
class RewardsPage extends Component {
  componentWillMount () {
    if (!this.props.isReady) { // TODO Refresh button or update through a watch callbacks
      this.props.getRewardsData(this.props.account)
    }
  }

  render () {
    const data = this.props.rewardsData
    const assetBalance = item => {
      return item.getId() === data.lastPeriodIndex()
        ? data.getCurrentAccumulated() // ongoing
        : item.getAssetBalance()
    }
    return (
      <PageBase title={<span>Rewards</span>}>
        <div style={globalStyles.description}>
          Rewards smart contract address: {data.address}<br />
          Current rewards period: {data.lastPeriodIndex()}<br />
          Period length: {data.getPeriodLength()} days<br /><br />

          My TIME deposit: {data.getAccountDeposit()} TIME<br />
          My current revenue available for withdrawal: {data.getAccountRewards()} LHT<br /><br />

          {data.getAccountRewards() ? <RaisedButton
            label='Withdraw Revenue'
            primary
            onTouchTap={this.props.handleWithdrawRevenue.bind(null, this.props.account)}
            buttonStyle={{...styles.raisedButton}}
            labelStyle={styles.raisedButtonLabel}
          /> : ''}
        </div>

        {data.periods.valueSeq().map(item =>
          <Paper key={item.getId()} style={globalStyles.item.paper}>
            <h2 style={globalStyles.item.title}>Rewards period #{item.getId()}</h2>

            {item.getId() === data.lastPeriodIndex()
              ? ongoingStatusBlock(item.getDaysPassed(), data.getPeriodLength())
              : closedStatusBlock}

            <div style={globalStyles.item.greyText}>
              Start date: {item.getStartDate()}<br />
              End date: {item.getEndDate()} (in {item.getDaysRemaining()} days)<br />

              Total TIME tokens deposited: {item.getTotalDeposit()} TIME (
              {item.getTotalDepositPercent(data.getTimeTotalSupply())}% of total count)<br />
              Unique shareholders: {item.getUniqueShareholders()}<br />
              Dividends accumulated for period:&nbsp;
              {assetBalance(item)} LHT<br /><br />

              Your TIME tokens eligible for rewards in the period: {item.getUserDeposit()} TIME
              ({item.getUserDepositPercent()}% of total deposited amount)<br />
              Your revenue accumulated for period:&nbsp;
              {item.getUserRevenue(assetBalance(item))} LHT<br />

              {item.isClosable() ? <RaisedButton
                label='Close Period'
                primary
                onTouchTap={this.props.handleClosePeriod.bind(null, this.props.account)}
                style={{marginTop: 23, marginBottom: 25}}
                buttonStyle={{...styles.raisedButton}}
                labelStyle={styles.raisedButtonLabel}
              /> : <p>&nbsp;</p>}
            </div>
          </Paper>
        )}
      </PageBase>
    )
  }
}

export default RewardsPage
