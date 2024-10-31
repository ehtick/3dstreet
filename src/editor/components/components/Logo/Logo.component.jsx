import { Button } from '../Button';
import PropTypes from 'prop-types';
import styles from './Logo.module.scss';

/**
 * Logo component.
 *
 * @author Oleksii Medvediev
 * @category Components
 */
const Logo = ({ onToggleEdit, isEditor }) => (
  <div className={styles.wrapper}>
    <div className={styles.logo} id="logoImg">
      {/* <svg width="140" height="36" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.58 28.3C7.46 28.3 6.46 28.16 5.58 27.88C4.7 27.58 3.95 27.19 3.33 26.71C2.73 26.23 2.26 25.69 1.92 25.09C1.6 24.47 1.43 23.83 1.41 23.17C1.41 22.99 1.47 22.85 1.59 22.75C1.71 22.65 1.86 22.6 2.04 22.6H2.46C2.62 22.6 2.77 22.64 2.91 22.72C3.07 22.8 3.19 22.99 3.27 23.29C3.49 24.15 3.88 24.82 4.44 25.3C5.02 25.76 5.67 26.08 6.39 26.26C7.13 26.42 7.86 26.5 8.58 26.5C10.12 26.5 11.38 26.13 12.36 25.39C13.36 24.65 13.86 23.54 13.86 22.06C13.86 20.58 13.41 19.52 12.51 18.88C11.63 18.24 10.42 17.92 8.88 17.92H6.24C6.04 17.92 5.88 17.86 5.76 17.74C5.64 17.62 5.58 17.46 5.58 17.26V16.81C5.58 16.65 5.6 16.52 5.64 16.42C5.7 16.3 5.77 16.19 5.85 16.09L12.03 8.8H2.97C2.77 8.8 2.61 8.74 2.49 8.62C2.37 8.5 2.31 8.34 2.31 8.14V7.69C2.31 7.47 2.37 7.3 2.49 7.18C2.61 7.06 2.77 7 2.97 7H14.16C14.38 7 14.55 7.06 14.67 7.18C14.79 7.3 14.85 7.47 14.85 7.69V8.14C14.85 8.26 14.82 8.37 14.76 8.47C14.72 8.55 14.67 8.63 14.61 8.71L8.28 16.12H8.88C10.26 16.12 11.46 16.34 12.48 16.78C13.52 17.2 14.32 17.85 14.88 18.73C15.46 19.61 15.75 20.72 15.75 22.06C15.75 23.38 15.44 24.51 14.82 25.45C14.2 26.37 13.35 27.08 12.27 27.58C11.19 28.06 9.96 28.3 8.58 28.3ZM20.7652 28C20.5652 28 20.4052 27.94 20.2852 27.82C20.1652 27.7 20.1052 27.54 20.1052 27.34V7.69C20.1052 7.47 20.1652 7.3 20.2852 7.18C20.4052 7.06 20.5652 7 20.7652 7H27.1552C29.2752 7 30.9352 7.31 32.1352 7.93C33.3352 8.55 34.1852 9.47 34.6852 10.69C35.2052 11.89 35.4752 13.36 35.4952 15.1C35.5152 16 35.5252 16.8 35.5252 17.5C35.5252 18.18 35.5152 18.97 35.4952 19.87C35.4552 21.71 35.1852 23.23 34.6852 24.43C34.1852 25.63 33.3452 26.53 32.1652 27.13C30.9852 27.71 29.3652 28 27.3052 28H20.7652ZM21.9952 26.2H27.1552C28.7552 26.2 30.0152 25.99 30.9352 25.57C31.8752 25.13 32.5452 24.44 32.9452 23.5C33.3652 22.54 33.5852 21.28 33.6052 19.72C33.6252 19.12 33.6352 18.6 33.6352 18.16C33.6352 17.7 33.6352 17.25 33.6352 16.81C33.6352 16.37 33.6252 15.85 33.6052 15.25C33.5652 13.05 33.0552 11.43 32.0752 10.39C31.0952 9.33 29.4052 8.8 27.0052 8.8H21.9952V26.2ZM47.5179 28.3C45.5179 28.3 43.8579 28.02 42.5379 27.46C41.2179 26.88 40.2179 26.13 39.5379 25.21C38.8579 24.29 38.4979 23.31 38.4579 22.27C38.4579 22.11 38.5179 21.97 38.6379 21.85C38.7779 21.71 38.9379 21.64 39.1179 21.64H42.8979C43.1779 21.64 43.3879 21.69 43.5279 21.79C43.6879 21.89 43.8279 22.02 43.9479 22.18C44.1079 22.48 44.3279 22.77 44.6079 23.05C44.9079 23.33 45.2879 23.56 45.7479 23.74C46.2279 23.9 46.8179 23.98 47.5179 23.98C48.6779 23.98 49.5479 23.8 50.1279 23.44C50.7279 23.08 51.0279 22.59 51.0279 21.97C51.0279 21.53 50.8679 21.17 50.5479 20.89C50.2279 20.59 49.7079 20.33 48.9879 20.11C48.2879 19.87 47.3479 19.63 46.1679 19.39C44.6479 19.07 43.3479 18.66 42.2679 18.16C41.2079 17.64 40.3979 16.97 39.8379 16.15C39.2779 15.31 38.9979 14.27 38.9979 13.03C38.9979 11.81 39.3379 10.72 40.0179 9.76C40.7179 8.8 41.6879 8.05 42.9279 7.51C44.1679 6.97 45.6379 6.7 47.3379 6.7C48.7179 6.7 49.9279 6.88 50.9679 7.24C52.0279 7.6 52.9179 8.08 53.6379 8.68C54.3579 9.28 54.8979 9.92 55.2579 10.6C55.6379 11.26 55.8379 11.91 55.8579 12.55C55.8579 12.71 55.7979 12.86 55.6779 13C55.5579 13.12 55.4079 13.18 55.2279 13.18H51.2679C51.0479 13.18 50.8579 13.14 50.6979 13.06C50.5379 12.98 50.3979 12.85 50.2779 12.67C50.1579 12.23 49.8379 11.85 49.3179 11.53C48.8179 11.19 48.1579 11.02 47.3379 11.02C46.4579 11.02 45.7679 11.18 45.2679 11.5C44.7879 11.8 44.5479 12.27 44.5479 12.91C44.5479 13.31 44.6779 13.66 44.9379 13.96C45.2179 14.26 45.6679 14.52 46.2879 14.74C46.9279 14.96 47.7979 15.19 48.8979 15.43C50.7179 15.77 52.1879 16.2 53.3079 16.72C54.4279 17.22 55.2479 17.88 55.7679 18.7C56.2879 19.5 56.5479 20.51 56.5479 21.73C56.5479 23.09 56.1579 24.27 55.3779 25.27C54.6179 26.25 53.5579 27 52.1979 27.52C50.8379 28.04 49.2779 28.3 47.5179 28.3ZM67.2012 28C65.9212 28 64.8112 27.8 63.8712 27.4C62.9512 26.98 62.2412 26.34 61.7412 25.48C61.2412 24.6 60.9912 23.47 60.9912 22.09V16.33H58.6512C58.4312 16.33 58.2412 16.26 58.0812 16.12C57.9412 15.98 57.8712 15.8 57.8712 15.58V13.15C57.8712 12.93 57.9412 12.75 58.0812 12.61C58.2412 12.47 58.4312 12.4 58.6512 12.4H60.9912V7.45C60.9912 7.23 61.0612 7.05 61.2012 6.91C61.3612 6.77 61.5412 6.7 61.7412 6.7H65.2212C65.4412 6.7 65.6212 6.77 65.7612 6.91C65.9012 7.05 65.9712 7.23 65.9712 7.45V12.4H69.7212C69.9412 12.4 70.1212 12.47 70.2612 12.61C70.4012 12.75 70.4712 12.93 70.4712 13.15V15.58C70.4712 15.8 70.4012 15.98 70.2612 16.12C70.1212 16.26 69.9412 16.33 69.7212 16.33H65.9712V21.67C65.9712 22.35 66.1012 22.89 66.3612 23.29C66.6212 23.69 67.0612 23.89 67.6812 23.89H69.9912C70.2112 23.89 70.3912 23.96 70.5312 24.1C70.6712 24.24 70.7412 24.42 70.7412 24.64V27.25C70.7412 27.47 70.6712 27.65 70.5312 27.79C70.3912 27.93 70.2112 28 69.9912 28H67.2012ZM73.9751 28C73.7551 28 73.5751 27.93 73.4351 27.79C73.2951 27.65 73.2251 27.47 73.2251 27.25V13.15C73.2251 12.95 73.2951 12.78 73.4351 12.64C73.5751 12.48 73.7551 12.4 73.9751 12.4H77.4251C77.6451 12.4 77.8251 12.48 77.9651 12.64C78.1051 12.78 78.1751 12.95 78.1751 13.15V14.35C78.7151 13.73 79.3551 13.25 80.0951 12.91C80.8551 12.57 81.7051 12.4 82.6451 12.4H83.9651C84.1651 12.4 84.3351 12.47 84.4751 12.61C84.6351 12.75 84.7151 12.93 84.7151 13.15V16.24C84.7151 16.44 84.6351 16.62 84.4751 16.78C84.3351 16.92 84.1651 16.99 83.9651 16.99H81.0551C80.2351 16.99 79.5951 17.22 79.1351 17.68C78.6951 18.12 78.4751 18.75 78.4751 19.57V27.25C78.4751 27.47 78.3951 27.65 78.2351 27.79C78.0951 27.93 77.9151 28 77.6951 28H73.9751ZM93.9309 28.3C91.5709 28.3 89.6909 27.66 88.2909 26.38C86.8909 25.1 86.1609 23.2 86.1009 20.68C86.1009 20.54 86.1009 20.36 86.1009 20.14C86.1009 19.92 86.1009 19.75 86.1009 19.63C86.1609 18.05 86.5109 16.7 87.1509 15.58C87.8109 14.44 88.7109 13.58 89.8509 13C91.0109 12.4 92.3609 12.1 93.9009 12.1C95.6609 12.1 97.1109 12.45 98.2509 13.15C99.4109 13.85 100.281 14.8 100.861 16C101.441 17.2 101.731 18.57 101.731 20.11V20.83C101.731 21.05 101.651 21.23 101.491 21.37C101.351 21.51 101.181 21.58 100.981 21.58H91.3809C91.3809 21.6 91.3809 21.63 91.3809 21.67C91.3809 21.71 91.3809 21.75 91.3809 21.79C91.4009 22.37 91.5009 22.9 91.6809 23.38C91.8609 23.86 92.1409 24.24 92.5209 24.52C92.9009 24.8 93.3609 24.94 93.9009 24.94C94.3009 24.94 94.6309 24.88 94.8909 24.76C95.1709 24.62 95.4009 24.47 95.5809 24.31C95.7609 24.13 95.9009 23.98 96.0009 23.86C96.1809 23.66 96.3209 23.54 96.4209 23.5C96.5409 23.44 96.7209 23.41 96.9609 23.41H100.681C100.881 23.41 101.041 23.47 101.161 23.59C101.301 23.69 101.361 23.84 101.341 24.04C101.321 24.38 101.151 24.79 100.831 25.27C100.511 25.75 100.041 26.23 99.4209 26.71C98.8209 27.17 98.0609 27.55 97.1409 27.85C96.2209 28.15 95.1509 28.3 93.9309 28.3ZM91.3809 18.61H96.4509V18.55C96.4509 17.91 96.3509 17.35 96.1509 16.87C95.9709 16.39 95.6809 16.02 95.2809 15.76C94.9009 15.5 94.4409 15.37 93.9009 15.37C93.3609 15.37 92.9009 15.5 92.5209 15.76C92.1609 16.02 91.8809 16.39 91.6809 16.87C91.4809 17.35 91.3809 17.91 91.3809 18.55V18.61ZM111.743 28.3C109.383 28.3 107.503 27.66 106.103 26.38C104.703 25.1 103.973 23.2 103.913 20.68C103.913 20.54 103.913 20.36 103.913 20.14C103.913 19.92 103.913 19.75 103.913 19.63C103.973 18.05 104.323 16.7 104.963 15.58C105.623 14.44 106.523 13.58 107.663 13C108.823 12.4 110.173 12.1 111.713 12.1C113.473 12.1 114.923 12.45 116.063 13.15C117.223 13.85 118.093 14.8 118.673 16C119.253 17.2 119.543 18.57 119.543 20.11V20.83C119.543 21.05 119.463 21.23 119.303 21.37C119.163 21.51 118.993 21.58 118.793 21.58H109.193C109.193 21.6 109.193 21.63 109.193 21.67C109.193 21.71 109.193 21.75 109.193 21.79C109.213 22.37 109.313 22.9 109.493 23.38C109.673 23.86 109.953 24.24 110.333 24.52C110.713 24.8 111.173 24.94 111.713 24.94C112.113 24.94 112.443 24.88 112.703 24.76C112.983 24.62 113.213 24.47 113.393 24.31C113.573 24.13 113.713 23.98 113.813 23.86C113.993 23.66 114.133 23.54 114.233 23.5C114.353 23.44 114.533 23.41 114.773 23.41H118.493C118.693 23.41 118.853 23.47 118.973 23.59C119.113 23.69 119.173 23.84 119.153 24.04C119.133 24.38 118.963 24.79 118.643 25.27C118.323 25.75 117.853 26.23 117.233 26.71C116.633 27.17 115.873 27.55 114.953 27.85C114.033 28.15 112.963 28.3 111.743 28.3ZM109.193 18.61H114.263V18.55C114.263 17.91 114.163 17.35 113.963 16.87C113.783 16.39 113.493 16.02 113.093 15.76C112.713 15.5 112.253 15.37 111.713 15.37C111.173 15.37 110.713 15.5 110.333 15.76C109.973 16.02 109.693 16.39 109.493 16.87C109.293 17.35 109.193 17.91 109.193 18.55V18.61ZM130.307 28C129.027 28 127.917 27.8 126.977 27.4C126.057 26.98 125.347 26.34 124.847 25.48C124.347 24.6 124.097 23.47 124.097 22.09V16.33H121.757C121.537 16.33 121.347 16.26 121.187 16.12C121.047 15.98 120.977 15.8 120.977 15.58V13.15C120.977 12.93 121.047 12.75 121.187 12.61C121.347 12.47 121.537 12.4 121.757 12.4H124.097V7.45C124.097 7.23 124.167 7.05 124.307 6.91C124.467 6.77 124.647 6.7 124.847 6.7H128.327C128.547 6.7 128.727 6.77 128.867 6.91C129.007 7.05 129.077 7.23 129.077 7.45V12.4H132.827C133.047 12.4 133.227 12.47 133.367 12.61C133.507 12.75 133.577 12.93 133.577 13.15V15.58C133.577 15.8 133.507 15.98 133.367 16.12C133.227 16.26 133.047 16.33 132.827 16.33H129.077V21.67C129.077 22.35 129.207 22.89 129.467 23.29C129.727 23.69 130.167 23.89 130.787 23.89H133.097C133.317 23.89 133.497 23.96 133.637 24.1C133.777 24.24 133.847 24.42 133.847 24.64V27.25C133.847 27.47 133.777 27.65 133.637 27.79C133.497 27.93 133.317 28 133.097 28H130.307Z" fill="#6100FF"/>
      </svg> */}
      <img src="ui_assets/favicon-32x32.png" alt="3DStreet Logo" />
    </div>
    <Button onClick={onToggleEdit} className={styles.btn} variant="toolbtn">
      {isEditor ? 'Enter Viewer mode' : 'Enter Editor mode'}
    </Button>
  </div>
);

Logo.propTypes = {
  onToggleEdit: PropTypes.func,
  isEditor: PropTypes.bool
};

export { Logo };
